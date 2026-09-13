import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";

function include() {
  return { klass: true, feeCategory: true } as const;
}

export async function listFeeStructures(filter: { classId?: string; campusId?: string; campusIdInOrNull?: string[] }) {
  const { campusIdInOrNull, ...rest } = filter;
  return prisma.feeStructure.findMany({
    where: {
      ...rest,
      // Campus Head/Office see their own campus's fee structures PLUS
      // institute-wide ones (campusId: null) — never another campus's.
      // Prisma's `in` never matches null, so this needs an explicit OR
      // rather than folding null into the `in` array.
      ...(campusIdInOrNull ? { OR: [{ campusId: { in: campusIdInOrNull } }, { campusId: null }] } : {}),
      archivedAt: null,
    },
    include: include(),
    orderBy: { createdAt: "desc" },
  });
}

// Thin getter for controllers that need to scope-check a fee structure by
// id before archiving it. Null campusId (institute-wide) means only
// SUPER_ADMIN/OFFICE-without-campus can archive it — the controller
// decides that, this just reports the value.
export async function getFeeStructureCampusId(id: string): Promise<string | null> {
  const structure = await prisma.feeStructure.findUnique({ where: { id }, select: { campusId: true } });
  if (!structure) throw new HttpError(404, "FEE_STRUCTURE_NOT_FOUND", "Fee structure not found");
  return structure.campusId;
}

export async function createFeeStructure(
  input: {
    instituteId: string;
    campusId?: string;
    classId: string;
    feeCategoryId: string;
    name: string;
    amount: string;
    frequency: "MONTHLY" | "ANNUAL" | "ONE_TIME";
    effectiveFrom: Date;
    effectiveTo?: Date;
  },
  actorId: string
) {
  const [klass, category, campus] = await Promise.all([
    prisma.class.findUnique({ where: { id: input.classId } }),
    prisma.feeCategory.findUnique({ where: { id: input.feeCategoryId } }),
    input.campusId ? prisma.campus.findUnique({ where: { id: input.campusId } }) : Promise.resolve(undefined),
  ]);
  if (!klass || klass.archivedAt) throw new HttpError(400, "CLASS_NOT_FOUND", "Class not found or archived");
  if (!category || category.archivedAt) throw new HttpError(400, "FEE_CATEGORY_NOT_FOUND", "Fee category not found or archived");
  if (input.campusId && (!campus || campus.archivedAt)) throw new HttpError(400, "CAMPUS_NOT_FOUND", "Campus not found or archived");
  if (Number(input.amount) <= 0) throw new HttpError(400, "INVALID_AMOUNT", "amount must be positive");

  const structure = await prisma.feeStructure.create({ data: input, include: include() });

  await writeAuditLog({ actorId, action: "CREATE", resource: "FeeStructure", recordId: structure.id, newValue: input });

  return structure;
}

export async function archiveFeeStructure(id: string, actorId: string) {
  const structure = await prisma.feeStructure.findUnique({ where: { id } });
  if (!structure) throw new HttpError(404, "FEE_STRUCTURE_NOT_FOUND", "Fee structure not found");
  if (structure.archivedAt) throw new HttpError(409, "ALREADY_ARCHIVED", "Fee structure already archived");

  const activeAssignments = await prisma.studentFee.count({ where: { feeStructureId: id, archivedAt: null } });
  if (activeAssignments > 0) {
    throw new HttpError(409, "FEE_STRUCTURE_IN_USE", "Cannot archive a fee structure with active student assignments");
  }

  const updated = await prisma.feeStructure.update({ where: { id }, data: { archivedAt: new Date() } });

  await writeAuditLog({ actorId, action: "ARCHIVE", resource: "FeeStructure", recordId: id, newValue: { archivedAt: updated.archivedAt } });

  return updated;
}
