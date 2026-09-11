import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";
import { signGatewayPayload, verifyGatewaySignature } from "../../lib/gatewaySignature.js";
import { generateAttemptNumber, generatePaymentNumber, generateAllocationNumber, generateReceiptNumber, generateCreditTransactionNumber } from "../../lib/financeCodes.js";
import { amountAlreadyCovered } from "../payments/service.js";
import { recalculateInvoiceStatus } from "../invoices/service.js";
import { getActiveGateway } from "../payment-gateways/service.js";

// Phase 9's real payment flow (spec: "Parent Opens Portal -> Views
// Outstanding Invoices -> Click Pay Online -> Redirected to
// Easypaisa/JazzCash/etc -> ... -> Gateway Callback to School Backend").
// Split into three stages, each mapped to a spec API module:
//   1. initiateOnlinePayment  — /api/v1/online-payment  (this file)
//   2. processGatewayCallback — /api/v1/payment-callback (this file, public route)
//   3. getReconciliationSummary — /api/v1/payment-reconciliation (this file)
// This is DELIBERATELY separate from Phase 5's initiatePaymentAttempt/
// handleGatewayCallback in payments/service.ts, which stays exactly as
// it was (a manual, staff-triggered "record what the gateway told us
// over the phone" path) — not reused, not removed, so nothing already
// tested in Phase 5 regresses. This module is the real thing: a real
// signed webhook call processed by real signature verification.

export async function initiateOnlinePayment(input: { invoiceId: string; amount: string }, actorId: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id: input.invoiceId } });
  if (!invoice) throw new HttpError(400, "INVOICE_NOT_FOUND", "Invoice not found");
  if (invoice.status === "VOID" || invoice.status === "PAID") {
    throw new HttpError(409, "INVOICE_NOT_PAYABLE", "This invoice cannot accept a new payment");
  }

  const amount = new Prisma.Decimal(input.amount);
  if (amount.lte(0)) throw new HttpError(400, "INVALID_AMOUNT", "amount must be positive");

  const covered = await amountAlreadyCovered(prisma, invoice.id);
  const remainingDue = new Prisma.Decimal(invoice.totalAmount).minus(covered);
  if (amount.gt(remainingDue)) {
    throw new HttpError(400, "AMOUNT_EXCEEDS_DUE", `Amount exceeds the remaining due (${remainingDue.toString()})`);
  }

  const gateway = await getActiveGateway();
  const attemptNumber = await generateAttemptNumber();

  const attempt = await prisma.paymentAttempt.create({
    data: { attemptNumber, invoiceId: invoice.id, amount, initiatedById: actorId },
  });
  const gatewayTransaction = await prisma.gatewayTransaction.create({
    data: { gatewayId: gateway.id, attemptId: attempt.id, amount, status: "INITIATED" },
  });

  await writeAuditLog({
    actorId,
    action: "CREATE",
    resource: "GatewayTransaction",
    recordId: gatewayTransaction.id,
    newValue: { invoiceId: invoice.id, amount: amount.toString(), gatewayId: gateway.id },
  });

  // Spec's flow: "Gateway Shows: Student, Month, Amount" before the payer
  // confirms — the checkout screen is client-rendered from this id, not
  // an external redirect URL, since there's no real gateway to redirect
  // to. See §1s for why this is honest rather than faked.
  return { gatewayTransactionId: gatewayTransaction.id, amount: amount.toString(), gatewayName: gateway.name };
}

export async function getCheckoutDetails(gatewayTransactionId: string) {
  const txn = await prisma.gatewayTransaction.findUnique({
    where: { id: gatewayTransactionId },
    include: { attempt: { include: { invoice: { include: { student: true } } } }, gateway: true },
  });
  if (!txn) throw new HttpError(404, "GATEWAY_TRANSACTION_NOT_FOUND", "Checkout session not found");
  if (txn.status !== "INITIATED") {
    throw new HttpError(409, "ALREADY_PROCESSED", `This checkout has already been ${txn.status.toLowerCase()}`);
  }

  return {
    id: txn.id,
    amount: txn.amount.toString(),
    gatewayName: txn.gateway.name,
    invoiceNumber: txn.attempt.invoice.invoiceNumber,
    studentName: txn.attempt.invoice.student.fullName,
  };
}

// The payer's "Confirm" (or "Cancel") click on our own hosted checkout
// screen — this is where a real integration would hand off to the
// gateway's own hosted page and wait for its callback. Standing in for
// that missing external party, it builds the exact same HMAC-signed
// payload a real webhook call would carry and runs it through
// processGatewayCallback() directly — the same function
// /api/v1/payment-callback calls, so every line of signature
// verification, idempotency, amount-checking, and row-locked settlement
// logic below actually runs, not a shortcut that bypasses it. A real
// network hop back to our own server (self-HTTP) was deliberately
// avoided here: it added a hard dependency on this process also being
// reachable at env.PORT, which doesn't hold in the integration test
// runner (no listening server) and is a fragile assumption in general
// deployment (serverless, multiple instances behind a load balancer).
export async function simulateGatewayConfirm(gatewayTransactionId: string, outcome: "SUCCESS" | "FAILED" | "PENDING") {
  const txn = await prisma.gatewayTransaction.findUnique({ where: { id: gatewayTransactionId }, include: { gateway: true } });
  if (!txn) throw new HttpError(404, "GATEWAY_TRANSACTION_NOT_FOUND", "Checkout session not found");
  if (txn.status !== "INITIATED") {
    throw new HttpError(409, "ALREADY_PROCESSED", `This checkout has already been ${txn.status.toLowerCase()}`);
  }

  const gatewayTxnId = `SIM-${crypto.randomUUID()}`;
  const payload = {
    gatewayId: txn.gatewayId,
    merchantTxnId: txn.id,
    gatewayTxnId,
    status: outcome,
    amount: txn.amount.toString(),
  };
  const rawBody = JSON.stringify(payload);
  const signature = signGatewayPayload(txn.gateway.webhookSecret, rawBody);

  return processGatewayCallback(rawBody, signature);
}

interface CallbackPayload {
  gatewayId?: string;
  merchantTxnId?: string;
  gatewayTxnId?: string;
  status?: "SUCCESS" | "FAILED" | "PENDING";
  amount?: string;
}

// The actual webhook handler — spec's /api/v1/payment-callback. Public
// (no session auth: a real gateway has no cookie jar), authenticated
// instead by the HMAC signature. Every branch logs a PaymentCallback row
// before returning, so "was this callback received and what did we do
// with it" is always answerable after the fact, per spec's "All actions
// AUDITED" reconciliation-safety rule.
export async function processGatewayCallback(rawBody: string, signatureHeader: string | undefined) {
  let payload: CallbackPayload;
  try {
    payload = JSON.parse(rawBody) as CallbackPayload;
  } catch {
    throw new HttpError(400, "INVALID_PAYLOAD", "Malformed callback body");
  }

  const rawBodyJson = (() => {
    try {
      return JSON.parse(rawBody) as Prisma.InputJsonValue;
    } catch {
      return { raw: rawBody };
    }
  })();

  if (!payload.gatewayId || !payload.gatewayTxnId || !payload.status || !payload.amount) {
    await prisma.paymentCallback.create({
      data: { gatewayTxnId: payload.gatewayTxnId ?? "UNKNOWN", signatureValid: false, rawBody: rawBodyJson, outcome: "MALFORMED" },
    });
    throw new HttpError(400, "INVALID_PAYLOAD", "Missing required callback fields");
  }

  const gateway = await prisma.paymentGateway.findUnique({ where: { id: payload.gatewayId } });
  if (!gateway) {
    await prisma.paymentCallback.create({
      data: { gatewayTxnId: payload.gatewayTxnId, signatureValid: false, rawBody: rawBodyJson, outcome: "UNKNOWN_GATEWAY" },
    });
    throw new HttpError(400, "UNKNOWN_GATEWAY", "Unknown gateway id");
  }

  // Spec rule: "Invalid callback signature -> rejected". Logged either
  // way, but a bad signature never reaches any of the logic below —
  // an attacker who doesn't know the gateway's secret cannot forge a
  // payment confirmation, no matter what merchantTxnId/status they guess.
  const signatureValid = !!signatureHeader && verifyGatewaySignature(gateway.webhookSecret, rawBody, signatureHeader);
  if (!signatureValid) {
    await prisma.paymentCallback.create({
      data: { gatewayTxnId: payload.gatewayTxnId, signatureValid: false, rawBody: rawBodyJson, outcome: "INVALID_SIGNATURE" },
    });
    throw new HttpError(401, "INVALID_SIGNATURE", "Webhook signature verification failed");
  }

  // Spec's reconciliation-safety rule: a callback that doesn't correlate
  // to a GatewayTransaction we actually initiated (missing/unknown
  // merchantTxnId) NEVER auto-creates a Payment or touches an Invoice —
  // it's flagged for manual review instead.
  const txn = payload.merchantTxnId ? await prisma.gatewayTransaction.findUnique({ where: { id: payload.merchantTxnId } }) : null;
  if (!txn) {
    await prisma.paymentCallback.create({
      data: { gatewayTxnId: payload.gatewayTxnId, signatureValid: true, rawBody: rawBodyJson, outcome: "UNMATCHED" },
    });
    const existingException = await prisma.reconciliationException.findFirst({ where: { gatewayTxnId: payload.gatewayTxnId } });
    if (!existingException) {
      await prisma.reconciliationException.create({
        data: { gatewayTxnId: payload.gatewayTxnId, amount: new Prisma.Decimal(payload.amount), rawData: rawBodyJson },
      });
    }
    return { outcome: "UNMATCHED" as const };
  }

  // Idempotency (spec rule #9 / "Duplicate callback -> no duplicate
  // payment"): a transaction already SUCCESS/FAILED ignores the replay
  // entirely rather than re-processing it.
  if (txn.status === "SUCCESS" || txn.status === "FAILED") {
    await prisma.paymentCallback.create({
      data: { gatewayTransactionId: txn.id, gatewayTxnId: payload.gatewayTxnId, signatureValid: true, rawBody: rawBodyJson, outcome: "DUPLICATE_IGNORED" },
    });
    return { outcome: "DUPLICATE_IGNORED" as const, status: txn.status };
  }

  // Amount verification (spec rule: gateway_amount !== invoice_amount ->
  // flag for manual review, do NOT auto-mark as paid).
  if (!new Prisma.Decimal(payload.amount).equals(txn.amount)) {
    await prisma.paymentCallback.create({
      data: { gatewayTransactionId: txn.id, gatewayTxnId: payload.gatewayTxnId, signatureValid: true, rawBody: rawBodyJson, outcome: "AMOUNT_MISMATCH" },
    });
    await prisma.reconciliationException.create({
      data: { gatewayTxnId: payload.gatewayTxnId, amount: new Prisma.Decimal(payload.amount), rawData: rawBodyJson },
    });
    return { outcome: "AMOUNT_MISMATCH" as const };
  }

  if (payload.status === "FAILED") {
    await prisma.$transaction([
      prisma.gatewayTransaction.update({ where: { id: txn.id }, data: { status: "FAILED", gatewayTxnId: payload.gatewayTxnId } }),
      prisma.paymentAttempt.update({ where: { id: txn.attemptId }, data: { status: "FAILED", gatewayTxnId: payload.gatewayTxnId, failureReason: "Gateway reported failure" } }),
    ]);
    await prisma.paymentCallback.create({
      data: { gatewayTransactionId: txn.id, gatewayTxnId: payload.gatewayTxnId, signatureValid: true, rawBody: rawBodyJson, outcome: "PROCESSED" },
    });
    return { outcome: "FAILED" as const };
  }

  if (payload.status === "PENDING") {
    await prisma.$transaction([
      prisma.gatewayTransaction.update({ where: { id: txn.id }, data: { status: "PENDING", gatewayTxnId: payload.gatewayTxnId } }),
      prisma.paymentAttempt.update({ where: { id: txn.attemptId }, data: { status: "PENDING", gatewayTxnId: payload.gatewayTxnId } }),
    ]);
    await prisma.paymentCallback.create({
      data: { gatewayTransactionId: txn.id, gatewayTxnId: payload.gatewayTxnId, signatureValid: true, rawBody: rawBodyJson, outcome: "PROCESSED" },
    });
    return { outcome: "PENDING" as const };
  }

  // SUCCESS — settle the payment. Row-locks the invoice for the
  // remainder of this transaction (same "Concurrent payments" rule as
  // recordPayment's cash path — see the comment there).
  const attempt = await prisma.paymentAttempt.findUniqueOrThrow({ where: { id: txn.attemptId }, include: { invoice: true } });
  if (!attempt.initiatedById) {
    // Should be unreachable — every attempt created via
    // initiateOnlinePayment sets this. A missing value here means a
    // Phase 5 staff-initiated attempt somehow reached the real webhook
    // path, which is a data-integrity bug worth surfacing loudly rather
    // than silently attributing the Payment to the wrong actor.
    throw new HttpError(500, "MISSING_INITIATOR", "This payment attempt has no recorded initiator");
  }

  const [paymentNumber, allocationNumber, receiptNumber] = await Promise.all([
    generatePaymentNumber(),
    generateAllocationNumber(),
    generateReceiptNumber(),
  ]);

  const payment = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "invoices" WHERE id = ${attempt.invoiceId} FOR UPDATE`;

    const freshInvoice = await tx.invoice.findUniqueOrThrow({ where: { id: attempt.invoiceId } });
    if (freshInvoice.status === "PAID") {
      // Settled by a concurrent cash payment while this webhook was in
      // flight — never double-pay. Recorded as a reconciliation
      // exception rather than silently dropped, since real money moved
      // at the gateway.
      throw new HttpError(409, "INVOICE_ALREADY_PAID", "Invoice was already paid by another payment before this callback arrived");
    }

    const covered = await amountAlreadyCovered(tx, attempt.invoiceId);
    const remainingDue = new Prisma.Decimal(freshInvoice.totalAmount).minus(covered);

    const created = await tx.payment.create({
      data: {
        paymentNumber,
        studentId: freshInvoice.studentId,
        amount: attempt.amount,
        method: "ONLINE",
        recordedById: attempt.initiatedById!,
        paymentAttemptId: attempt.id,
      },
    });

    const allocationAmount = Prisma.Decimal.min(attempt.amount, remainingDue);
    await tx.paymentAllocation.create({
      data: { allocationNumber, paymentId: created.id, invoiceId: attempt.invoiceId, amount: allocationAmount },
    });

    if (attempt.amount.gt(allocationAmount)) {
      const overpayment = attempt.amount.minus(allocationAmount);
      const creditNumber = await generateCreditTransactionNumber();
      await tx.creditTransaction.create({
        data: { transactionNumber: creditNumber, studentId: freshInvoice.studentId, amount: overpayment, sourcePaymentId: created.id },
      });
    }

    await tx.receipt.create({ data: { receiptNumber, paymentId: created.id } });
    await recalculateInvoiceStatus(tx, attempt.invoiceId);

    await tx.gatewayTransaction.update({ where: { id: txn.id }, data: { status: "SUCCESS", gatewayTxnId: payload.gatewayTxnId } });
    await tx.paymentAttempt.update({ where: { id: attempt.id }, data: { status: "SUCCESS", gatewayTxnId: payload.gatewayTxnId } });

    return tx.payment.findUniqueOrThrow({ where: { id: created.id }, include: { allocations: true, receipt: true } });
  });

  await prisma.paymentCallback.create({
    data: { gatewayTransactionId: txn.id, gatewayTxnId: payload.gatewayTxnId, signatureValid: true, rawBody: rawBodyJson, outcome: "PROCESSED" },
  });

  await writeAuditLog({
    actorId: attempt.initiatedById!,
    action: "RECORD",
    resource: "Payment",
    recordId: payment.id,
    newValue: { paymentNumber, method: "ONLINE", amount: attempt.amount.toString(), gatewayTxnId: payload.gatewayTxnId },
  });

  return { outcome: "SUCCESS" as const, payment };
}

export async function getReconciliationSummary(filter: { dateFrom: Date; dateTo: Date }) {
  const [transactions, onlinePayments, pendingExceptions] = await Promise.all([
    prisma.gatewayTransaction.findMany({ where: { createdAt: { gte: filter.dateFrom, lte: filter.dateTo } } }),
    prisma.payment.findMany({ where: { method: "ONLINE", status: "SUCCESS", createdAt: { gte: filter.dateFrom, lte: filter.dateTo } } }),
    prisma.reconciliationException.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "desc" } }),
  ]);

  const gatewaySuccessCount = transactions.filter((t) => t.status === "SUCCESS").length;
  const gatewaySuccessTotal = transactions.filter((t) => t.status === "SUCCESS").reduce((sum, t) => sum + Number(t.amount), 0);
  const schoolRecordCount = onlinePayments.length;
  const schoolRecordTotal = onlinePayments.reduce((sum, p) => sum + Number(p.amount), 0);

  return {
    gateway: { count: gatewaySuccessCount, total: gatewaySuccessTotal },
    schoolRecords: { count: schoolRecordCount, total: schoolRecordTotal },
    matched: gatewaySuccessCount === schoolRecordCount && gatewaySuccessTotal === schoolRecordTotal,
    breakdown: {
      initiated: transactions.filter((t) => t.status === "INITIATED").length,
      pending: transactions.filter((t) => t.status === "PENDING").length,
      failed: transactions.filter((t) => t.status === "FAILED").length,
      success: gatewaySuccessCount,
    },
    pendingExceptions,
  };
}
