import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";

async function requireInstitute() {
  const institute = await prisma.institute.findFirst();
  if (!institute) {
    throw new HttpError(409, "INSTITUTE_NOT_CONFIGURED", "Configure the institute before adding subjects");
  }
  return institute;
}

export async function listSubjects() {
  return prisma.subject.findMany({ orderBy: { name: "asc" } });
}

export async function createSubject(input: { name: string; code?: string }, actorId: string) {
  const institute = await requireInstitute();

  const existing = await prisma.subject.findUnique({
    where: { instituteId_name: { instituteId: institute.id, name: input.name } },
  });
  if (existing) {
    throw new HttpError(409, "SUBJECT_EXISTS", `A subject named "${input.name}" already exists`);
  }

  const subject = await prisma.subject.create({ data: { ...input, instituteId: institute.id } });

  await writeAuditLog({ actorId, action: "CREATE", resource: "Subject", recordId: subject.id, newValue: { name: subject.name } });

  return subject;
}

export async function updateSubject(id: string, input: Partial<{ name: string; code: string }>, actorId: string) {
  const subject = await prisma.subject.findUnique({ where: { id } });
  if (!subject) throw new HttpError(404, "SUBJECT_NOT_FOUND", "Subject not found");
  if (subject.archivedAt) throw new HttpError(409, "SUBJECT_ARCHIVED", "Cannot edit an archived subject");

  const updated = await prisma.subject.update({ where: { id }, data: input });

  await writeAuditLog({
    actorId,
    action: "UPDATE",
    resource: "Subject",
    recordId: id,
    oldValue: { name: subject.name, code: subject.code },
    newValue: { name: updated.name, code: updated.code },
  });

  return updated;
}

// DEVIATION: spec's Phase 2 permission list only names subject.view/create/
// edit (no subject.archive). Given the blanket no-hard-delete policy, an
// archive path is still necessary — gated behind subject.archive, added the
// same way user.disable-style permissions were for other catalogs.
export async function archiveSubject(id: string, actorId: string) {
  const subject = await prisma.subject.findUnique({ where: { id } });
  if (!subject) throw new HttpError(404, "SUBJECT_NOT_FOUND", "Subject not found");
  if (subject.archivedAt) throw new HttpError(409, "SUBJECT_ALREADY_ARCHIVED", "Subject is already archived");

  const activeAssignment = await prisma.teacherAssignment.findFirst({
    where: { subjectId: id, archivedAt: null },
  });
  if (activeAssignment) {
    throw new HttpError(409, "SUBJECT_HAS_ACTIVE_ASSIGNMENTS", "Cannot archive a subject with active teacher assignments");
  }

  const updated = await prisma.subject.update({ where: { id }, data: { archivedAt: new Date() } });

  await writeAuditLog({ actorId, action: "ARCHIVE", resource: "Subject", recordId: id, newValue: { archivedAt: updated.archivedAt } });

  return updated;
}
