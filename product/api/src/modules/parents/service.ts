import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";

// Spec: "Parent Can Have Multiple Children — Link, don't duplicate." Search
// by phone (or nationalId, a stronger signal — Phase 11 Phase C-addendum)
// before creating a new parent record, same idea as student duplicate
// search.
export async function searchParents(phone: string) {
  const q = phone.trim();
  if (!q) return [];
  return prisma.parent.findMany({
    where: { OR: [{ phone: { contains: q } }, { nationalId: { contains: q } }] },
    include: { children: { include: { student: true } } },
    take: 20,
  });
}

// Exact-match strict check, used during Admission Inquiry conversion.
export async function findParentByNationalId(nationalId: string) {
  return prisma.parent.findUnique({ where: { nationalId } });
}

export async function listParents(campusIdIn?: string[]) {
  return prisma.parent.findMany({
    // A parent isn't campus-owned itself (their children can span
    // campuses) — "in scope" means at least one linked child currently
    // enrolled at one of the actor's campuses. See
    // docs/PHASE_11A_CAMPUS_SCOPING_IMPLEMENTATION_PLAN.md Group 4.
    where: campusIdIn
      ? { children: { some: { student: { enrollments: { some: { status: "ACTIVE", section: { campusId: { in: campusIdIn } } } } } } } }
      : undefined,
    include: { children: { include: { student: true } } },
    orderBy: { createdAt: "desc" },
  });
}

// Thin getters for controllers that need to scope-check a parent/link by
// id before updating/unlinking — a Parent isn't campus-owned itself (see
// listParents above), so "in scope" means at least one linked child
// currently enrolled at one of the actor's campuses.
export async function getParentCampusIds(parentId: string): Promise<string[]> {
  const links = await prisma.studentParent.findMany({
    where: { parentId },
    include: { student: { include: { enrollments: { where: { status: "ACTIVE" }, include: { section: true } } } } },
  });
  const campusIds = links.flatMap((l) => l.student.enrollments.map((e) => e.section.campusId));
  return [...new Set(campusIds)];
}

export async function getStudentParentLinkStudentId(studentParentId: string): Promise<string> {
  const link = await prisma.studentParent.findUnique({ where: { id: studentParentId }, select: { studentId: true } });
  if (!link) throw new HttpError(404, "LINK_NOT_FOUND", "Parent-child link not found");
  return link.studentId;
}

export async function createParent(
  input: { fullName: string; phone: string; email?: string; address?: string; nationalId?: string },
  actorId: string
) {
  let parent;
  try {
    parent = await prisma.parent.create({ data: input });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new HttpError(409, "NATIONAL_ID_ALREADY_USED", "This CNIC is already linked to another parent");
    }
    throw err;
  }

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
  input: Partial<{ fullName: string; phone: string; email: string; address: string; nationalId: string | null }>,
  actorId: string
) {
  const parent = await prisma.parent.findUnique({ where: { id } });
  if (!parent) throw new HttpError(404, "PARENT_NOT_FOUND", "Parent not found");

  let updated;
  try {
    updated = await prisma.parent.update({ where: { id }, data: input });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new HttpError(409, "NATIONAL_ID_ALREADY_USED", "This CNIC is already linked to another parent");
    }
    throw err;
  }

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
