import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";
import { studentScopeWhereDirect, type StudentScopeFilter } from "../../lib/scope.js";

export async function listDiscounts(filter: StudentScopeFilter & { status?: string }) {
  return prisma.discount.findMany({
    where: { ...studentScopeWhereDirect(filter), status: filter.status as never },
    include: { feeStructure: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createDiscount(
  input: {
    studentId: string;
    feeStructureId?: string;
    type: "SIBLING" | "MERIT" | "STAFF" | "OTHER";
    amount?: string;
    percentage?: string;
    reason: string;
  },
  actorId: string
) {
  const student = await prisma.student.findUnique({ where: { id: input.studentId } });
  if (!student || student.status === "ARCHIVED") throw new HttpError(400, "STUDENT_NOT_FOUND", "Student not found or archived");

  if ((input.amount && input.percentage) || (!input.amount && !input.percentage)) {
    throw new HttpError(400, "AMOUNT_OR_PERCENTAGE", "Provide exactly one of amount or percentage");
  }
  if (input.percentage && (Number(input.percentage) <= 0 || Number(input.percentage) > 100)) {
    throw new HttpError(400, "INVALID_PERCENTAGE", "percentage must be between 0 and 100");
  }

  const discount = await prisma.discount.create({ data: { ...input, requestedById: actorId } });

  await writeAuditLog({ actorId, action: "CREATE", resource: "Discount", recordId: discount.id, newValue: input });

  return discount;
}

// Thin getter for controllers that need to scope-check a discount by id
// before deciding it.
export async function getDiscountStudentId(id: string): Promise<string> {
  const discount = await prisma.discount.findUnique({ where: { id }, select: { studentId: true } });
  if (!discount) throw new HttpError(404, "DISCOUNT_NOT_FOUND", "Discount not found");
  return discount.studentId;
}

export async function decideDiscount(id: string, decision: "APPROVED" | "REJECTED", actorId: string) {
  const discount = await prisma.discount.findUnique({ where: { id } });
  if (!discount) throw new HttpError(404, "DISCOUNT_NOT_FOUND", "Discount not found");
  if (discount.status !== "PENDING") throw new HttpError(409, "ALREADY_DECIDED", `Discount already ${discount.status.toLowerCase()}`);

  const updated = await prisma.discount.update({
    where: { id },
    data: { status: decision, approvedById: actorId, approvedAt: decision === "APPROVED" ? new Date() : undefined },
  });

  await writeAuditLog({
    actorId,
    action: decision,
    resource: "Discount",
    recordId: id,
    approvedBy: decision === "APPROVED" ? actorId : undefined,
  });

  return updated;
}
