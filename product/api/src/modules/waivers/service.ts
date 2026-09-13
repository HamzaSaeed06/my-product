import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";
import { recalculateInvoiceStatus } from "../invoices/service.js";
import { studentScopeWhereVia, type StudentScopeFilter } from "../../lib/scope.js";

export async function listWaivers(filter: StudentScopeFilter & { invoiceId?: string; status?: string }) {
  const { invoiceId, ...studentFilter } = filter;
  return prisma.waiver.findMany({
    where: { invoiceId, ...studentScopeWhereVia(studentFilter, "invoice"), status: filter.status as never },
    include: { invoice: true, requestedBy: { select: { id: true, fullName: true } } },
    orderBy: { createdAt: "desc" },
  });
}

// Thin getters for controllers that need to scope-check before creating/
// deciding a waiver.
export async function getInvoiceStudentIdForWaiver(invoiceId: string): Promise<string> {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, select: { studentId: true } });
  if (!invoice) throw new HttpError(400, "INVOICE_NOT_FOUND", "Invoice not found");
  return invoice.studentId;
}

export async function getWaiverStudentId(id: string): Promise<string> {
  const waiver = await prisma.waiver.findUnique({ where: { id }, select: { invoice: { select: { studentId: true } } } });
  if (!waiver) throw new HttpError(404, "WAIVER_NOT_FOUND", "Waiver not found");
  return waiver.invoice.studentId;
}

export async function createWaiver(input: { invoiceId: string; amount: string; reason: string }, actorId: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id: input.invoiceId } });
  if (!invoice) throw new HttpError(400, "INVOICE_NOT_FOUND", "Invoice not found");
  if (invoice.status === "VOID") throw new HttpError(409, "INVOICE_VOID", "Cannot waive a voided invoice");

  const amount = new Prisma.Decimal(input.amount);
  if (amount.lte(0) || amount.gt(invoice.totalAmount)) {
    throw new HttpError(400, "INVALID_AMOUNT", "Waiver amount must be positive and not exceed the invoice total");
  }

  const waiver = await prisma.waiver.create({ data: { ...input, amount, requestedById: actorId } });

  await writeAuditLog({ actorId, action: "CREATE", resource: "Waiver", recordId: waiver.id, newValue: { invoiceId: input.invoiceId, amount: amount.toString() } });

  return waiver;
}

export async function decideWaiver(id: string, decision: "APPROVED" | "REJECTED", actorId: string) {
  const waiver = await prisma.waiver.findUnique({ where: { id } });
  if (!waiver) throw new HttpError(404, "WAIVER_NOT_FOUND", "Waiver not found");
  if (waiver.status !== "PENDING") throw new HttpError(409, "ALREADY_DECIDED", `Waiver already ${waiver.status.toLowerCase()}`);

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.waiver.update({
      where: { id },
      data: { status: decision, approvedById: actorId, approvedAt: decision === "APPROVED" ? new Date() : undefined },
    });
    if (decision === "APPROVED") {
      await recalculateInvoiceStatus(tx, waiver.invoiceId);
    }
    return result;
  });

  await writeAuditLog({
    actorId,
    action: decision,
    resource: "Waiver",
    recordId: id,
    approvedBy: decision === "APPROVED" ? actorId : undefined,
  });

  return updated;
}
