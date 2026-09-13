import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";
import type { SectionScopeFilter } from "../../lib/scope.js";

function include() {
  return { section: true, subject: true, teacher: { include: { user: true } } } as const;
}

export async function createClassDiaryEntry(
  input: { sectionId: string; subjectId?: string; teacherId: string; date: Date; note: string },
  actorId: string
) {
  const [section, teacher] = await Promise.all([
    prisma.section.findUnique({ where: { id: input.sectionId } }),
    prisma.teacher.findUnique({ where: { id: input.teacherId } }),
  ]);
  if (!section || section.archivedAt) throw new HttpError(400, "SECTION_NOT_FOUND", "Section not found or archived");
  if (!teacher || teacher.status === "ARCHIVED") throw new HttpError(400, "TEACHER_NOT_FOUND", "Teacher not found or archived");
  if (input.subjectId) {
    const subject = await prisma.subject.findUnique({ where: { id: input.subjectId } });
    if (!subject || subject.archivedAt) throw new HttpError(400, "SUBJECT_NOT_FOUND", "Subject not found or archived");
  }

  const entry = await prisma.classDiaryEntry.create({ data: input, include: include() });

  await writeAuditLog({ actorId, action: "CREATE", resource: "ClassDiaryEntry", recordId: entry.id, newValue: input });

  return entry;
}

export async function listClassDiaryEntries(filter: {
  subjectId?: string;
  date?: string;
  scope: SectionScopeFilter;
}) {
  const { scope, date, subjectId } = filter;
  return prisma.classDiaryEntry.findMany({
    where: { ...scope, subjectId, date: date ? new Date(date) : undefined, archivedAt: null },
    include: include(),
    orderBy: { date: "desc" },
  });
}

export async function getClassDiaryEntrySectionId(id: string): Promise<string> {
  const entry = await prisma.classDiaryEntry.findUnique({ where: { id }, select: { sectionId: true } });
  if (!entry) throw new HttpError(404, "CLASS_DIARY_ENTRY_NOT_FOUND", "Class diary entry not found");
  return entry.sectionId;
}

export async function updateClassDiaryEntry(id: string, input: { note?: string }, actorId: string) {
  const existing = await prisma.classDiaryEntry.findUnique({ where: { id } });
  if (!existing || existing.archivedAt) throw new HttpError(404, "CLASS_DIARY_ENTRY_NOT_FOUND", "Class diary entry not found");

  const updated = await prisma.classDiaryEntry.update({ where: { id }, data: input, include: include() });

  await writeAuditLog({ actorId, action: "UPDATE", resource: "ClassDiaryEntry", recordId: id, oldValue: existing, newValue: input });

  return updated;
}

export async function archiveClassDiaryEntry(id: string, actorId: string) {
  const existing = await prisma.classDiaryEntry.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "CLASS_DIARY_ENTRY_NOT_FOUND", "Class diary entry not found");
  if (existing.archivedAt) throw new HttpError(409, "ALREADY_ARCHIVED", "Class diary entry already archived");

  const updated = await prisma.classDiaryEntry.update({ where: { id }, data: { archivedAt: new Date() } });

  await writeAuditLog({ actorId, action: "ARCHIVE", resource: "ClassDiaryEntry", recordId: id, newValue: { archivedAt: updated.archivedAt } });

  return updated;
}
