import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";

function include() {
  return { feeStructure: { include: { klass: true, feeCategory: true } } } as const;
}

export async function listStudentFees(filter: { studentId?: string }) {
  return prisma.studentFee.findMany({ where: { ...filter, archivedAt: null }, include: include(), orderBy: { createdAt: "desc" } });
}

export async function assignStudentFee(
  input: { studentId: string; feeStructureId: string; overrideAmount?: string },
  actorId: string
) {
  const [student, feeStructure] = await Promise.all([
    prisma.student.findUnique({ where: { id: input.studentId } }),
    prisma.feeStructure.findUnique({ where: { id: input.feeStructureId } }),
  ]);
  if (!student || student.status === "ARCHIVED") throw new HttpError(400, "STUDENT_NOT_FOUND", "Student not found or archived");
  if (!feeStructure || feeStructure.archivedAt) throw new HttpError(400, "FEE_STRUCTURE_NOT_FOUND", "Fee structure not found or archived");

  try {
    const studentFee = await prisma.studentFee.create({ data: input, include: include() });

    await writeAuditLog({ actorId, action: "CREATE", resource: "StudentFee", recordId: studentFee.id, newValue: input });

    return studentFee;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new HttpError(409, "ALREADY_ASSIGNED", "This fee structure is already assigned to this student");
    }
    throw err;
  }
}

export async function archiveStudentFee(id: string, actorId: string) {
  const studentFee = await prisma.studentFee.findUnique({ where: { id } });
  if (!studentFee) throw new HttpError(404, "STUDENT_FEE_NOT_FOUND", "Student fee assignment not found");
  if (studentFee.archivedAt) throw new HttpError(409, "ALREADY_ARCHIVED", "Already archived");

  const updated = await prisma.studentFee.update({ where: { id }, data: { archivedAt: new Date() } });

  await writeAuditLog({ actorId, action: "ARCHIVE", resource: "StudentFee", recordId: id, newValue: { archivedAt: updated.archivedAt } });

  return updated;
}
