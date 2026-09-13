import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";
import { createDocumentRecord } from "../documents/service.js";

function include() {
  return {
    subject: true,
    section: true,
    klass: true,
    teacher: { include: { user: true } },
    attachments: { include: { document: true } },
  } as const;
}

export async function createHomework(
  input: { subjectId: string; sectionId: string; classId: string; teacherId: string; title: string; description?: string; dueDate: Date },
  files: Express.Multer.File[],
  actorId: string
) {
  const [subject, section, teacher] = await Promise.all([
    prisma.subject.findUnique({ where: { id: input.subjectId } }),
    prisma.section.findUnique({ where: { id: input.sectionId } }),
    prisma.teacher.findUnique({ where: { id: input.teacherId } }),
  ]);
  if (!subject || subject.archivedAt) throw new HttpError(400, "SUBJECT_NOT_FOUND", "Subject not found or archived");
  if (!section || section.archivedAt) throw new HttpError(400, "SECTION_NOT_FOUND", "Section not found or archived");
  if (!teacher || teacher.status === "ARCHIVED") throw new HttpError(400, "TEACHER_NOT_FOUND", "Teacher not found or archived");
  if (section.classId !== input.classId) throw new HttpError(400, "SECTION_CLASS_MISMATCH", "This section does not belong to the given class");

  // Files are uploaded (and land on disk, storage-limit-checked) one at a
  // time via createDocumentRecord — same as every other document-backed
  // module in this codebase, just looped for the (now) one-to-many case.
  const documentIds: string[] = [];
  for (const file of files) {
    const document = await createDocumentRecord(file, { category: "homework" }, actorId);
    documentIds.push(document.id);
  }

  const homework = await prisma.homework.create({
    data: {
      ...input,
      attachments: { create: documentIds.map((documentId) => ({ documentId })) },
    },
    include: include(),
  });

  await writeAuditLog({ actorId, action: "CREATE", resource: "Homework", recordId: homework.id, newValue: { ...input, documentIds } });

  return homework;
}

export async function addHomeworkAttachment(homeworkId: string, file: Express.Multer.File, actorId: string) {
  const existing = await prisma.homework.findUnique({ where: { id: homeworkId } });
  if (!existing || existing.archivedAt) throw new HttpError(404, "HOMEWORK_NOT_FOUND", "Homework not found");

  const document = await createDocumentRecord(file, { category: "homework" }, actorId);
  const attachment = await prisma.homeworkAttachment.create({
    data: { homeworkId, documentId: document.id },
    include: { document: true },
  });

  await writeAuditLog({ actorId, action: "CREATE", resource: "HomeworkAttachment", recordId: attachment.id, newValue: { homeworkId, documentId: document.id } });

  return attachment;
}

export async function getHomeworkSectionId(id: string): Promise<string> {
  const homework = await prisma.homework.findUnique({ where: { id }, select: { sectionId: true } });
  if (!homework) throw new HttpError(404, "HOMEWORK_NOT_FOUND", "Homework not found");
  return homework.sectionId;
}

export async function listHomework(filter: {
  subjectId?: string;
  classId?: string;
  scope: { sectionId?: string } | { section: { campusId: { in: string[] } } };
}) {
  const { scope, ...rest } = filter;
  return prisma.homework.findMany({ where: { ...rest, ...scope, archivedAt: null }, include: include(), orderBy: { dueDate: "asc" } });
}

export async function updateHomework(
  id: string,
  input: { title?: string; description?: string; dueDate?: Date },
  actorId: string
) {
  const existing = await prisma.homework.findUnique({ where: { id } });
  if (!existing || existing.archivedAt) throw new HttpError(404, "HOMEWORK_NOT_FOUND", "Homework not found");

  const updated = await prisma.homework.update({ where: { id }, data: input, include: include() });

  await writeAuditLog({ actorId, action: "UPDATE", resource: "Homework", recordId: id, oldValue: existing, newValue: input });

  return updated;
}

export async function publishHomework(id: string, actorId: string) {
  const existing = await prisma.homework.findUnique({ where: { id } });
  if (!existing || existing.archivedAt) throw new HttpError(404, "HOMEWORK_NOT_FOUND", "Homework not found");
  if (existing.status === "PUBLISHED") throw new HttpError(409, "ALREADY_PUBLISHED", "Homework already published");

  const updated = await prisma.homework.update({
    where: { id },
    data: { status: "PUBLISHED", publishedAt: new Date() },
    include: include(),
  });

  await writeAuditLog({ actorId, action: "PUBLISH", resource: "Homework", recordId: id, newValue: { status: "PUBLISHED" } });

  return updated;
}

export async function archiveHomework(id: string, actorId: string) {
  const existing = await prisma.homework.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "HOMEWORK_NOT_FOUND", "Homework not found");
  if (existing.archivedAt) throw new HttpError(409, "ALREADY_ARCHIVED", "Homework already archived");

  const updated = await prisma.homework.update({ where: { id }, data: { archivedAt: new Date() } });

  await writeAuditLog({ actorId, action: "ARCHIVE", resource: "Homework", recordId: id, newValue: { archivedAt: updated.archivedAt } });

  return updated;
}
