import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";
import { createApprovalRequest } from "../approvals/service.js";
import { recalculateInvoiceStatus } from "../invoices/service.js";
import {
  generatePaymentNumber,
  generateAllocationNumber,
  generateReceiptNumber,
  generateCreditTransactionNumber,
  generateAttemptNumber,
} from "../../lib/financeCodes.js";

function paymentInclude() {
  return { allocations: true, receipt: true, paymentAttempt: true } as const;
}

async function amountAlreadyCovered(tx: Prisma.TransactionClient, invoiceId: string): Promise<Prisma.Decimal> {
  const [allocations, waivers, credits] = await Promise.all([
    tx.paymentAllocation.aggregate({ where: { invoiceId, status: "ACTIVE" }, _sum: { amount: true } }),
    tx.waiver.aggregate({ where: { invoiceId, status: "APPROVED" }, _sum: { amount: true } }),
    tx.creditTransaction.aggregate({ where: { usedOnInvoiceId: invoiceId, status: "USED" }, _sum: { amount: true } }),
  ]);
  return new Prisma.Decimal(allocations._sum.amount ?? 0).plus(waivers._sum.amount ?? 0).plus(credits._sum.amount ?? 0);
}

// The cash payment workflow (spec's Workflow #1): verify invoice, record
// payment, allocate against it (partial payments per rule #5, overpayment
// becomes a CreditTransaction per rule #6), recalculate invoice status,
// generate a receipt — all in one transaction so a Payment never exists
// without its Allocation/Receipt.
export async function recordPayment(
  input: { studentId: string; invoiceId: string; amount: string; applyCreditId?: string },
  actorId: string
) {
  const invoice = await prisma.invoice.findUnique({ where: { id: input.invoiceId } });
  if (!invoice) throw new HttpError(400, "INVOICE_NOT_FOUND", "Invoice not found");
  if (invoice.studentId !== input.studentId) throw new HttpError(400, "INVOICE_STUDENT_MISMATCH", "This invoice does not belong to this student");
  if (invoice.status === "VOID") throw new HttpError(409, "INVOICE_VOID", "Cannot pay a voided invoice");
  if (invoice.status === "PAID") throw new HttpError(409, "INVOICE_ALREADY_PAID", "This invoice is already fully paid");

  const amount = new Prisma.Decimal(input.amount);
  if (amount.lte(0)) throw new HttpError(400, "INVALID_AMOUNT", "amount must be positive");

  const [paymentNumber, allocationNumber, receiptNumber] = await Promise.all([
    generatePaymentNumber(),
    generateAllocationNumber(),
    generateReceiptNumber(),
  ]);

  const result = await prisma.$transaction(async (tx) => {
    if (input.applyCreditId) {
      const credit = await tx.creditTransaction.findUnique({ where: { id: input.applyCreditId } });
      if (!credit || credit.status !== "AVAILABLE") throw new HttpError(400, "CREDIT_NOT_AVAILABLE", "Credit is not available to apply");
      if (credit.studentId !== input.studentId) throw new HttpError(400, "CREDIT_STUDENT_MISMATCH", "This credit does not belong to this student");
      await tx.creditTransaction.update({ where: { id: credit.id }, data: { status: "USED", usedOnInvoiceId: invoice.id, usedAt: new Date() } });
    }

    const covered = await amountAlreadyCovered(tx, invoice.id);
    const remainingDue = new Prisma.Decimal(invoice.totalAmount).minus(covered);
    if (remainingDue.lte(0)) throw new HttpError(409, "INVOICE_ALREADY_PAID", "This invoice is already fully covered");

    const payment = await tx.payment.create({
      data: { paymentNumber, studentId: input.studentId, amount, method: "CASH", recordedById: actorId },
    });

    const allocationAmount = Prisma.Decimal.min(amount, remainingDue);
    await tx.paymentAllocation.create({
      data: { allocationNumber, paymentId: payment.id, invoiceId: invoice.id, amount: allocationAmount },
    });

    if (amount.gt(allocationAmount)) {
      const overpayment = amount.minus(allocationAmount);
      const creditNumber = await generateCreditTransactionNumber();
      await tx.creditTransaction.create({
        data: {
          transactionNumber: creditNumber,
          studentId: input.studentId,
          amount: overpayment,
          sourcePaymentId: payment.id,
        },
      });
    }

    await tx.receipt.create({ data: { receiptNumber, paymentId: payment.id } });
    await recalculateInvoiceStatus(tx, invoice.id);

    return tx.payment.findUniqueOrThrow({ where: { id: payment.id }, include: paymentInclude() });
  });

  await writeAuditLog({
    actorId,
    action: "RECORD",
    resource: "Payment",
    recordId: result.id,
    newValue: { paymentNumber, invoiceId: invoice.id, amount: amount.toString() },
  });

  return result;
}

export async function listPayments(filter: { studentId?: string; studentIdIn?: string[] }) {
  return prisma.payment.findMany({
    where: { studentId: filter.studentIdIn ? { in: filter.studentIdIn } : filter.studentId },
    include: paymentInclude(),
    orderBy: { createdAt: "desc" },
  });
}

export async function requestPaymentReversal(paymentId: string, reason: string, actorId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new HttpError(404, "PAYMENT_NOT_FOUND", "Payment not found");
  if (payment.status === "REVERSED") throw new HttpError(409, "ALREADY_REVERSED", "Payment is already reversed");

  return createApprovalRequest({
    type: "PAYMENT_REVERSAL",
    resource: "Payment",
    recordId: paymentId,
    requestedById: actorId,
    approverRole: "PRINCIPAL",
    payload: { paymentId, reason },
  });
}

// Applies the effect directly here, not in the generic approvals module —
// same reasoning as every other correction-style decider in this codebase.
// Never deletes the Payment/Allocation/Receipt (spec rule #2) — only flips
// their status and recalculates the invoice(s) affected.
export async function decidePaymentReversal(
  approvalRequestId: string,
  decision: "APPROVED" | "REJECTED",
  decisionNote: string | undefined,
  actorId: string
) {
  const request = await prisma.approvalRequest.findUnique({ where: { id: approvalRequestId } });
  if (!request || request.type !== "PAYMENT_REVERSAL") {
    throw new HttpError(404, "REVERSAL_NOT_FOUND", "Payment reversal request not found");
  }
  if (request.status !== "PENDING") {
    throw new HttpError(409, "APPROVAL_ALREADY_DECIDED", `Request already ${request.status.toLowerCase()}`);
  }

  const payload = request.payload as { paymentId: string; reason: string };

  const updatedRequest = await prisma.$transaction(async (tx) => {
    const req = await tx.approvalRequest.update({
      where: { id: approvalRequestId },
      data: { status: decision, decidedById: actorId, decidedAt: new Date(), decisionNote },
    });

    if (decision === "APPROVED") {
      const allocations = await tx.paymentAllocation.findMany({ where: { paymentId: payload.paymentId, status: "ACTIVE" } });

      await tx.payment.update({
        where: { id: payload.paymentId },
        data: { status: "REVERSED", reversedById: actorId, reversedAt: new Date(), reversalReason: payload.reason },
      });
      await tx.paymentAllocation.updateMany({ where: { paymentId: payload.paymentId, status: "ACTIVE" }, data: { status: "REVERSED" } });
      await tx.receipt.updateMany({ where: { paymentId: payload.paymentId }, data: { status: "CANCELLED", cancelledAt: new Date() } });

      const invoiceIds = [...new Set(allocations.map((a) => a.invoiceId))];
      for (const invoiceId of invoiceIds) {
        await recalculateInvoiceStatus(tx, invoiceId);
      }
    }

    return req;
  });

  await writeAuditLog({
    actorId,
    action: decision === "APPROVED" ? "APPROVE" : "REJECT",
    resource: "Payment",
    recordId: payload.paymentId,
    reason: payload.reason,
    newValue: decision === "APPROVED" ? { status: "REVERSED" } : undefined,
    approvedBy: decision === "APPROVED" ? actorId : undefined,
  });

  return updatedRequest;
}

export async function listCreditTransactions(filter: { studentId?: string }) {
  return prisma.creditTransaction.findMany({ where: filter, orderBy: { createdAt: "desc" } });
}

// ── Online payment scaffolding (spec's Workflow #2 + rules #8/#9/#10) ──
// Real gateway HTTP calls are Phase 9's job (see schema.prisma's Phase 5
// header comment); this models the state machine and idempotency the spec
// requires so Phase 9 has a proven shape to plug a real gateway into.

export async function initiatePaymentAttempt(invoiceId: string, amount: string, actorId: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) throw new HttpError(400, "INVOICE_NOT_FOUND", "Invoice not found");
  if (invoice.status === "VOID" || invoice.status === "PAID") {
    throw new HttpError(409, "INVOICE_NOT_PAYABLE", "This invoice cannot accept a new payment attempt");
  }

  const attemptNumber = await generateAttemptNumber();
  const attempt = await prisma.paymentAttempt.create({ data: { attemptNumber, invoiceId, amount: new Prisma.Decimal(amount) } });

  await writeAuditLog({ actorId, action: "CREATE", resource: "PaymentAttempt", recordId: attempt.id, newValue: { invoiceId, amount } });

  return attempt;
}

// Simulates a gateway callback — in production (Phase 9) this is the
// webhook handler. Idempotent by attempt status (spec rule #9: a
// replayed callback for an already-SUCCESS attempt is a no-op, not a
// second Payment) and by invoice status (never pays an already-PAID
// invoice twice). NOTE: this uses a Prisma interactive transaction for
// the check-then-act sequence, not a raw `SELECT ... FOR UPDATE` row
// lock — adequate for this phase's manual-trigger scope, but real
// concurrent-webhook-safety when a live gateway is wired up in Phase 9
// should add an explicit row lock (see spec rule #8's worked example).
export async function handleGatewayCallback(
  attemptId: string,
  input: { status: "SUCCESS" | "FAILED"; gatewayTxnId: string },
  actorId: string
) {
  const attempt = await prisma.paymentAttempt.findUnique({ where: { id: attemptId }, include: { invoice: true } });
  if (!attempt) throw new HttpError(404, "ATTEMPT_NOT_FOUND", "Payment attempt not found");

  if (attempt.status === "SUCCESS" || attempt.status === "FAILED") {
    return { alreadyProcessed: true, attempt };
  }

  if (attempt.invoice.status === "PAID") {
    const failed = await prisma.paymentAttempt.update({
      where: { id: attemptId },
      data: { status: "FAILED", gatewayTxnId: input.gatewayTxnId, failureReason: "Invoice already paid" },
    });
    return { alreadyProcessed: false, attempt: failed };
  }

  if (input.status === "FAILED") {
    const failed = await prisma.paymentAttempt.update({
      where: { id: attemptId },
      data: { status: "FAILED", gatewayTxnId: input.gatewayTxnId, failureReason: "Gateway reported failure" },
    });
    await writeAuditLog({ actorId, action: "UPDATE", resource: "PaymentAttempt", recordId: attemptId, newValue: { status: "FAILED" } });
    return { alreadyProcessed: false, attempt: failed };
  }

  const [paymentNumber, allocationNumber, receiptNumber] = await Promise.all([
    generatePaymentNumber(),
    generateAllocationNumber(),
    generateReceiptNumber(),
  ]);

  const payment = await prisma.$transaction(async (tx) => {
    const covered = await amountAlreadyCovered(tx, attempt.invoiceId);
    const remainingDue = new Prisma.Decimal(attempt.invoice.totalAmount).minus(covered);
    const allocationAmount = Prisma.Decimal.min(attempt.amount, remainingDue.gt(0) ? remainingDue : attempt.amount);

    const created = await tx.payment.create({
      data: {
        paymentNumber,
        studentId: attempt.invoice.studentId,
        amount: attempt.amount,
        method: "ONLINE",
        recordedById: actorId,
        paymentAttemptId: attempt.id,
      },
    });
    await tx.paymentAllocation.create({
      data: { allocationNumber, paymentId: created.id, invoiceId: attempt.invoiceId, amount: allocationAmount },
    });
    await tx.receipt.create({ data: { receiptNumber, paymentId: created.id } });
    await tx.paymentAttempt.update({ where: { id: attemptId }, data: { status: "SUCCESS", gatewayTxnId: input.gatewayTxnId } });
    await recalculateInvoiceStatus(tx, attempt.invoiceId);

    return tx.payment.findUniqueOrThrow({ where: { id: created.id }, include: paymentInclude() });
  });

  await writeAuditLog({ actorId, action: "RECORD", resource: "Payment", recordId: payment.id, newValue: { paymentNumber, method: "ONLINE" } });

  return { alreadyProcessed: false, payment };
}

// Spec's Reconciliation Safety Rule: a gateway transaction with no
// matching PaymentAttempt NEVER auto-creates a Payment.
export async function recordUnmatchedGatewayTransaction(input: { gatewayTxnId: string; amount: string; rawData?: unknown }) {
  const existingAttempt = await prisma.paymentAttempt.findUnique({ where: { gatewayTxnId: input.gatewayTxnId } });
  if (existingAttempt) {
    throw new HttpError(409, "ATTEMPT_ALREADY_MATCHED", "A payment attempt already matches this gateway transaction");
  }

  return prisma.reconciliationException.create({
    data: { gatewayTxnId: input.gatewayTxnId, amount: new Prisma.Decimal(input.amount), rawData: input.rawData as Prisma.InputJsonValue },
  });
}

export async function listReconciliationExceptions(filter: { status?: string }) {
  return prisma.reconciliationException.findMany({ where: { status: filter.status as never }, orderBy: { createdAt: "desc" } });
}

export async function resolveReconciliationException(
  id: string,
  decision: "RESOLVED" | "REJECTED",
  note: string | undefined,
  actorId: string
) {
  const exception = await prisma.reconciliationException.findUnique({ where: { id } });
  if (!exception) throw new HttpError(404, "EXCEPTION_NOT_FOUND", "Reconciliation exception not found");
  if (exception.status !== "PENDING") throw new HttpError(409, "ALREADY_RESOLVED", "Exception already resolved");

  const updated = await prisma.reconciliationException.update({
    where: { id },
    data: { status: decision, resolvedById: actorId, resolvedAt: new Date(), resolutionNote: note },
  });

  await writeAuditLog({
    actorId,
    action: decision,
    resource: "ReconciliationException",
    recordId: id,
    reason: note,
  });

  return updated;
}
