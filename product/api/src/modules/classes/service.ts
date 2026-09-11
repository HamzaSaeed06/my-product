import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";

async function requireInstitute() {
  const institute = await prisma.institute.findFirst();
  if (!institute) {
    throw new HttpError(409, "INSTITUTE_NOT_CONFIGURED", "Configure the institute before adding classes");
  }
  return institute;
}

export async function listClasses() {
  return prisma.class.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
}

export async function createClass(input: { name: string; sortOrder?: number }, actorId: string) {
  const institute = await requireInstitute();

  const existing = await prisma.class.findUnique({
    where: { instituteId_name: { instituteId: institute.id, name: input.name } },
  });
  if (existing) {
    throw new HttpError(409, "CLASS_EXISTS", `A class named "${input.name}" already exists`);
  }

  const klass = await prisma.class.create({
    data: { name: input.name, sortOrder: input.sortOrder ?? 0, instituteId: institute.id },
  });

  await writeAuditLog({ actorId, action: "CREATE", resource: "Class", recordId: klass.id, newValue: { name: klass.name } });

  return klass;
}

export async function updateClass(
  id: string,
  input: Partial<{ name: string; sortOrder: number }>,
  actorId: string
) {
  const klass = await prisma.class.findUnique({ where: { id } });
  if (!klass) throw new HttpError(404, "CLASS_NOT_FOUND", "Class not found");
  if (klass.archivedAt) throw new HttpError(409, "CLASS_ARCHIVED", "Cannot edit an archived class");

  const updated = await prisma.class.update({ where: { id }, data: input });

  await writeAuditLog({
    actorId,
    action: "UPDATE",
    resource: "Class",
    recordId: id,
    oldValue: { name: klass.name, sortOrder: klass.sortOrder },
    newValue: { name: updated.name, sortOrder: updated.sortOrder },
  });

  return updated;
}

export async function archiveClass(id: string, actorId: string) {
  const klass = await prisma.class.findUnique({ where: { id } });
  if (!klass) throw new HttpError(404, "CLASS_NOT_FOUND", "Class not found");
  if (klass.archivedAt) throw new HttpError(409, "CLASS_ALREADY_ARCHIVED", "Class is already archived");

  const activeSection = await prisma.section.findFirst({ where: { classId: id, archivedAt: null } });
  if (activeSection) {
    throw new HttpError(409, "CLASS_HAS_ACTIVE_SECTIONS", "Cannot archive a class with active sections");
  }

  const updated = await prisma.class.update({ where: { id }, data: { archivedAt: new Date() } });

  await writeAuditLog({ actorId, action: "ARCHIVE", resource: "Class", recordId: id, newValue: { archivedAt: updated.archivedAt } });

  return updated;
}
