import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";
import { generateRefundNumber } from "../../lib/financeCodes.js";

export async function listRefunds(filter: { status?: string }) {
  return prisma.refund.findMany({
    where: { status: filter.status as never },
    include: { payment: true, requestedBy: { select: { id: true, fullName: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createRefund(input: { paymentId: string; amount: string; reason: string; method?: string }, actorId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: input.paymentId } });
  if (!payment) throw new HttpError(400, "PAYMENT_NOT_FOUND", "Payment not found");
  if (payment.status === "REVERSED") throw new HttpError(409, "PAYMENT_REVERSED", "Cannot refund a reversed payment");

  const amount = new Prisma.Decimal(input.amount);
  if (amount.lte(0) || amount.gt(payment.amount)) {
    throw new HttpError(400, "INVALID_AMOUNT", "Refund amount must be positive and not exceed the original payment");
  }

  const alreadyRefunded = await prisma.refund.aggregate({
    where: { paymentId: input.paymentId, status: { in: ["APPROVED", "COMPLETED"] } },
    _sum: { amount: true },
  });
  const remaining = new Prisma.Decimal(payment.amount).minus(alreadyRefunded._sum.amount ?? 0);
  if (amount.gt(remaining)) {
    throw new HttpError(409, "EXCEEDS_REFUNDABLE_AMOUNT", `Only ${remaining.toString()} of this payment remains refundable`);
  }

  const refundNumber = await generateRefundNumber();
  const refund = await prisma.refund.create({
    data: { refundNumber, paymentId: input.paymentId, amount, reason: input.reason, method: input.method, requestedById: actorId },
  });

  await writeAuditLog({ actorId, action: "CREATE", resource: "Refund", recordId: refund.id, newValue: { refundNumber, amount: amount.toString() } });

  return refund;
}

export async function decideRefund(id: string, decision: "APPROVED" | "REJECTED", actorId: string) {
  const refund = await prisma.refund.findUnique({ where: { id } });
  if (!refund) throw new HttpError(404, "REFUND_NOT_FOUND", "Refund not found");
  if (refund.status !== "PENDING") throw new HttpError(409, "ALREADY_DECIDED", `Refund already ${refund.status.toLowerCase()}`);

  const updated = await prisma.refund.update({
    where: { id },
    data: { status: decision, approvedById: actorId, approvedAt: decision === "APPROVED" ? new Date() : undefined },
  });

  await writeAuditLog({
    actorId,
    action: decision,
    resource: "Refund",
    recordId: id,
    approvedBy: decision === "APPROVED" ? actorId : undefined,
  });

  return updated;
}

// Marks a refund COMPLETED — the actual money movement (bank transfer,
// cash handout) happens outside this system; this records that it was
// carried out. Kept as a separate step from approval per spec's workflow
// (Approval -> Refund Payment -> Create Refund Record already exists, this
// closes the loop).
//
// Phase 9 spec test #10 ("Refund through gateway -> processed
// correctly"): when the original Payment was made ONLINE, completing its
// refund also records a gatewayRefundReference — standing in for the
// gateway's own refund API call, same honest-simulation pattern as the
// rest of Phase 9 (no real gateway account exists to call for real). A
// CASH payment's refund has no gateway leg, so this stays null for it.
export async function completeRefund(id: string, actorId: string) {
  const refund = await prisma.refund.findUnique({ where: { id }, include: { payment: true } });
  if (!refund) throw new HttpError(404, "REFUND_NOT_FOUND", "Refund not found");
  if (refund.status !== "APPROVED") throw new HttpError(409, "NOT_APPROVED", "Only an approved refund can be marked completed");

  const gatewayRefundReference = refund.payment.method === "ONLINE" ? `GWREFUND-${randomUUID()}` : undefined;

  const updated = await prisma.refund.update({
    where: { id },
    data: { status: "COMPLETED", completedAt: new Date(), gatewayRefundReference },
  });

  await writeAuditLog({
    actorId,
    action: "COMPLETE",
    resource: "Refund",
    recordId: id,
    newValue: { status: "COMPLETED", gatewayRefundReference },
  });

  return updated;
}
