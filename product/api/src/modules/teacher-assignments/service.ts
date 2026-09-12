import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";

export async function listTeacherAssignments(filter: { teacherId?: string; sectionId?: string; academicYearId?: string }) {
  return prisma.teacherAssignment.findMany({
    where: { ...filter, archivedAt: null },
    include: { teacher: { include: { user: true } }, subject: true, klass: true, section: true, academicYear: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createTeacherAssignment(
  input: { teacherId: string; subjectId: string; classId: string; sectionId: string; academicYearId: string },
  actorId: string
) {
  const [teacher, subject, section] = await Promise.all([
    prisma.teacher.findUnique({ where: { id: input.teacherId } }),
    prisma.subject.findUnique({ where: { id: input.subjectId } }),
    prisma.section.findUnique({ where: { id: input.sectionId } }),
  ]);

  if (!teacher || teacher.status === "ARCHIVED") throw new HttpError(400, "TEACHER_NOT_FOUND", "Teacher not found or archived");
  if (!subject || subject.archivedAt) throw new HttpError(400, "SUBJECT_NOT_FOUND", "Subject not found or archived");
  if (!section || section.archivedAt) throw new HttpError(400, "SECTION_NOT_FOUND", "Section not found or archived");
  if (section.classId !== input.classId) {
    throw new HttpError(400, "SECTION_CLASS_MISMATCH", "This section does not belong to the given class");
  }
  if (section.academicYearId !== input.academicYearId) {
    throw new HttpError(400, "SECTION_YEAR_MISMATCH", "This section does not belong to the given academic year");
  }

  try {
    const assignment = await prisma.teacherAssignment.create({ data: input });

    await writeAuditLog({
      actorId,
      action: "CREATE",
      resource: "TeacherAssignment",
      recordId: assignment.id,
      newValue: input,
    });

    return assignment;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new HttpError(409, "ASSIGNMENT_EXISTS", "This teacher is already assigned to this subject/section/year");
    }
    throw err;
  }
}

export async function archiveTeacherAssignment(id: string, actorId: string) {
  const assignment = await prisma.teacherAssignment.findUnique({ where: { id } });
  if (!assignment) throw new HttpError(404, "ASSIGNMENT_NOT_FOUND", "Teacher assignment not found");
  if (assignment.archivedAt) throw new HttpError(409, "ASSIGNMENT_ALREADY_ARCHIVED", "Assignment already ended");

  const updated = await prisma.teacherAssignment.update({ where: { id }, data: { archivedAt: new Date() } });

  await writeAuditLog({
    actorId,
    action: "ARCHIVE",
    resource: "TeacherAssignment",
    recordId: id,
    newValue: { archivedAt: updated.archivedAt },
  });

  return updated;
}
