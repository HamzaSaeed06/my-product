import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";

export async function listCashClosings(filter: { campusId?: string; campusIdIn?: string[] }) {
  return prisma.cashClosing.findMany({
    where: { campusId: filter.campusIdIn ? { in: filter.campusIdIn } : filter.campusId },
    include: { closedBy: { select: { id: true, fullName: true } }, approvedBy: { select: { id: true, fullName: true } } },
    orderBy: { date: "desc" },
  });
}

// Thin getter for controllers that need to scope-check a cash closing by
// id before approving it.
export async function getCashClosingCampusId(id: string): Promise<string> {
  const closing = await prisma.cashClosing.findUnique({ where: { id }, select: { campusId: true } });
  if (!closing) throw new HttpError(404, "CASH_CLOSING_NOT_FOUND", "Cash closing not found");
  return closing.campusId;
}

// collections/refundsPaidOut are the cashier's own physical tally for the
// day (this system has no per-cashier register-session concept scoping
// which payments belong to which counter), not derived from Payment rows —
// expectedBalance/variance are computed from what the cashier reports.
// Every closing requires explicit approval regardless of variance size —
// a deliberate simplification over a conditional "only approve if
// variance != 0" rule, for one uniform workflow.
export async function createCashClosing(
  input: { campusId: string; date: Date; openingBalance: string; collections: string; refundsPaidOut: string; actualBalance: string },
  actorId: string
) {
  const campus = await prisma.campus.findUnique({ where: { id: input.campusId } });
  if (!campus || campus.archivedAt) throw new HttpError(400, "CAMPUS_NOT_FOUND", "Campus not found or archived");

  const openingBalance = new Prisma.Decimal(input.openingBalance);
  const collections = new Prisma.Decimal(input.collections);
  const refundsPaidOut = new Prisma.Decimal(input.refundsPaidOut);
  const actualBalance = new Prisma.Decimal(input.actualBalance);
  const expectedBalance = openingBalance.plus(collections).minus(refundsPaidOut);
  const variance = actualBalance.minus(expectedBalance);

  try {
    const closing = await prisma.cashClosing.create({
      data: { campusId: input.campusId, date: input.date, openingBalance, collections, refundsPaidOut, expectedBalance, actualBalance, variance, closedById: actorId },
    });

    await writeAuditLog({
      actorId,
      action: "CREATE",
      resource: "CashClosing",
      recordId: closing.id,
      newValue: { campusId: input.campusId, date: input.date, variance: variance.toString() },
    });

    return closing;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new HttpError(409, "CASH_CLOSING_EXISTS", "A cash closing already exists for this campus/date");
    }
    throw err;
  }
}

export async function approveCashClosing(id: string, actorId: string) {
  const closing = await prisma.cashClosing.findUnique({ where: { id } });
  if (!closing) throw new HttpError(404, "CASH_CLOSING_NOT_FOUND", "Cash closing not found");
  if (closing.status === "APPROVED") throw new HttpError(409, "ALREADY_APPROVED", "Cash closing already approved");

  const updated = await prisma.cashClosing.update({
    where: { id },
    data: { status: "APPROVED", approvedById: actorId, approvedAt: new Date() },
  });

  await writeAuditLog({ actorId, action: "APPROVE", resource: "CashClosing", recordId: id, approvedBy: actorId });

  return updated;
}
