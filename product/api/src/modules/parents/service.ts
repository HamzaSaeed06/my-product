import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";

// Spec: "Parent Can Have Multiple Children — Link, don't duplicate." Search
// by phone before creating a new parent record, same idea as student
// duplicate search.
export async function searchParents(phone: string) {
  const q = phone.trim();
  if (!q) return [];
  return prisma.parent.findMany({
    where: { phone: { contains: q } },
    include: { children: { include: { student: true } } },
    take: 20,
  });
}

export async function listParents() {
  return prisma.parent.findMany({
    include: { children: { include: { student: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createParent(
  input: { fullName: string; phone: string; email?: string; address?: string },
  actorId: string
) {
  const parent = await prisma.parent.create({ data: input });

  await writeAuditLog({
    actorId,
    action: "CREATE",
    resource: "Parent",
    recordId: parent.id,
    newValue: { fullName: parent.fullName, phone: parent.phone },
  });

  return parent;
}

export async function updateParent(
  id: string,
  input: Partial<{ fullName: string; phone: string; email: string; address: string }>,
  actorId: string
) {
  const parent = await prisma.parent.findUnique({ where: { id } });
  if (!parent) throw new HttpError(404, "PARENT_NOT_FOUND", "Parent not found");

  const updated = await prisma.parent.update({ where: { id }, data: input });

  await writeAuditLog({
    actorId,
    action: "UPDATE",
    resource: "Parent",
    recordId: id,
    oldValue: { fullName: parent.fullName, phone: parent.phone },
    newValue: { fullName: updated.fullName, phone: updated.phone },
  });

  return updated;
}

export async function linkChild(
  parentId: string,
  input: { studentId: string; relationship?: string; isPrimary?: boolean },
  actorId: string
) {
  const [parent, student] = await Promise.all([
    prisma.parent.findUnique({ where: { id: parentId } }),
    prisma.student.findUnique({ where: { id: input.studentId } }),
  ]);
  if (!parent) throw new HttpError(404, "PARENT_NOT_FOUND", "Parent not found");
  if (!student) throw new HttpError(404, "STUDENT_NOT_FOUND", "Student not found");

  const existing = await prisma.studentParent.findUnique({
    where: { studentId_parentId: { studentId: input.studentId, parentId } },
  });
  if (existing) {
    throw new HttpError(409, "LINK_EXISTS", "This parent is already linked to this student");
  }

  const link = await prisma.studentParent.create({
    data: {
      parentId,
      studentId: input.studentId,
      relationship: input.relationship,
      isPrimary: input.isPrimary ?? false,
    },
  });

  await writeAuditLog({
    actorId,
    action: "LINK",
    resource: "StudentParent",
    recordId: link.id,
    newValue: { parentId, studentId: input.studentId, relationship: input.relationship },
  });

  return link;
}

export async function unlinkChild(parentId: string, studentParentId: string, actorId: string) {
  const link = await prisma.studentParent.findUnique({ where: { id: studentParentId } });
  if (!link || link.parentId !== parentId) {
    throw new HttpError(404, "LINK_NOT_FOUND", "Parent-child link not found");
  }

  await prisma.studentParent.delete({ where: { id: studentParentId } });

  await writeAuditLog({
    actorId,
    action: "UNLINK",
    resource: "StudentParent",
    recordId: studentParentId,
    oldValue: { parentId, studentId: link.studentId },
  });
}
