import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";

export async function listExams(filter: { academicYearId?: string }) {
  return prisma.exam.findMany({ where: filter, orderBy: { createdAt: "desc" } });
}

export async function createExam(input: { academicYearId: string; name: string }, actorId: string) {
  const academicYear = await prisma.academicYear.findUnique({ where: { id: input.academicYearId } });
  if (!academicYear) throw new HttpError(400, "ACADEMIC_YEAR_NOT_FOUND", "Academic year not found");
  if (academicYear.status === "CLOSED") throw new HttpError(409, "ACADEMIC_YEAR_CLOSED", "Cannot create an exam in a closed academic year");

  try {
    const exam = await prisma.exam.create({ data: input });

    await writeAuditLog({ actorId, action: "CREATE", resource: "Exam", recordId: exam.id, newValue: input });

    return exam;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new HttpError(409, "EXAM_EXISTS", "An exam with this name already exists for this academic year");
    }
    throw err;
  }
}

export async function publishExam(id: string, actorId: string) {
  const exam = await prisma.exam.findUnique({ where: { id } });
  if (!exam) throw new HttpError(404, "EXAM_NOT_FOUND", "Exam not found");
  if (exam.status === "PUBLISHED") throw new HttpError(409, "ALREADY_PUBLISHED", "Exam schedule already published");

  const updated = await prisma.exam.update({ where: { id }, data: { status: "PUBLISHED", publishedAt: new Date() } });

  await writeAuditLog({ actorId, action: "PUBLISH", resource: "Exam", recordId: id, newValue: { status: "PUBLISHED" } });

  return updated;
}
