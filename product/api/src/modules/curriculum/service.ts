import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";

export async function listCurriculum(filter: { subjectId?: string; classId?: string; academicYearId?: string }) {
  return prisma.curriculum.findMany({
    where: { ...filter, archivedAt: null },
    include: { subject: true, klass: true, progress: { include: { section: true } } },
    orderBy: { sortOrder: "asc" },
  });
}

export async function createCurriculumTopic(
  input: { subjectId: string; classId: string; academicYearId: string; topic: string; sortOrder?: number; expectedCompletionDate?: Date },
  actorId: string
) {
  const [subject, klass, academicYear] = await Promise.all([
    prisma.subject.findUnique({ where: { id: input.subjectId } }),
    prisma.class.findUnique({ where: { id: input.classId } }),
    prisma.academicYear.findUnique({ where: { id: input.academicYearId } }),
  ]);
  if (!subject || subject.archivedAt) throw new HttpError(400, "SUBJECT_NOT_FOUND", "Subject not found or archived");
  if (!klass || klass.archivedAt) throw new HttpError(400, "CLASS_NOT_FOUND", "Class not found or archived");
  if (!academicYear) throw new HttpError(400, "ACADEMIC_YEAR_NOT_FOUND", "Academic year not found");

  const topic = await prisma.curriculum.create({ data: input });

  await writeAuditLog({ actorId, action: "CREATE", resource: "Curriculum", recordId: topic.id, newValue: input });

  return topic;
}

export async function updateCurriculumTopic(
  id: string,
  input: { topic?: string; sortOrder?: number; expectedCompletionDate?: Date | null },
  actorId: string
) {
  const existing = await prisma.curriculum.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "CURRICULUM_NOT_FOUND", "Curriculum topic not found");

  const updated = await prisma.curriculum.update({ where: { id }, data: input });

  await writeAuditLog({ actorId, action: "UPDATE", resource: "Curriculum", recordId: id, oldValue: existing, newValue: input });

  return updated;
}

export async function archiveCurriculumTopic(id: string, actorId: string) {
  const existing = await prisma.curriculum.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "CURRICULUM_NOT_FOUND", "Curriculum topic not found");
  if (existing.archivedAt) throw new HttpError(409, "ALREADY_ARCHIVED", "Topic already archived");

  const updated = await prisma.curriculum.update({ where: { id }, data: { archivedAt: new Date() } });

  await writeAuditLog({ actorId, action: "ARCHIVE", resource: "Curriculum", recordId: id, newValue: { archivedAt: updated.archivedAt } });

  return updated;
}

// Upsert: marking progress on a topic+section pair for the first time
// creates the row; marking it again (e.g. un-completing) updates it.
export async function markCurriculumProgress(
  curriculumId: string,
  sectionId: string,
  input: { completed: boolean; notes?: string },
  actorId: string
) {
  const [curriculum, section] = await Promise.all([
    prisma.curriculum.findUnique({ where: { id: curriculumId } }),
    prisma.section.findUnique({ where: { id: sectionId } }),
  ]);
  if (!curriculum || curriculum.archivedAt) throw new HttpError(400, "CURRICULUM_NOT_FOUND", "Curriculum topic not found or archived");
  if (!section || section.archivedAt) throw new HttpError(400, "SECTION_NOT_FOUND", "Section not found or archived");
  if (section.classId !== curriculum.classId) {
    throw new HttpError(400, "SECTION_CLASS_MISMATCH", "This section does not belong to the topic's class");
  }

  const data = input.completed
    ? { completedAt: new Date(), completedById: actorId, notes: input.notes }
    : { completedAt: null, completedById: null, notes: input.notes };

  const progress = await prisma.curriculumProgress.upsert({
    where: { curriculumId_sectionId: { curriculumId, sectionId } },
    create: { curriculumId, sectionId, ...data },
    update: data,
  });

  await writeAuditLog({
    actorId,
    action: "UPDATE",
    resource: "CurriculumProgress",
    recordId: progress.id,
    newValue: { curriculumId, sectionId, completed: input.completed },
  });

  return progress;
}
