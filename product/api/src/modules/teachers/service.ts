import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";
import { assertStaffLimit } from "../../lib/licenseLimits.js";

export async function listTeachers(campusIdIn?: string[]) {
  return prisma.teacher.findMany({
    where: campusIdIn
      ? { user: { userRoles: { some: { role: { name: "TEACHER" }, campusId: { in: campusIdIn } } } } }
      : undefined,
    include: { user: { select: { id: true, fullName: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
}

// Thin getter for controllers that need to scope-check a teacher by id
// before editing/archiving it — a Teacher's campus is their own TEACHER
// UserRole.campusId, not a direct column.
export async function getTeacherCampusIds(id: string): Promise<string[]> {
  const teacher = await prisma.teacher.findUnique({
    where: { id },
    include: { user: { include: { userRoles: { where: { role: { name: "TEACHER" } } } } } },
  });
  if (!teacher) throw new HttpError(404, "TEACHER_NOT_FOUND", "Teacher not found");
  return teacher.user.userRoles.map((ur) => ur.campusId).filter((id): id is string => !!id);
}

// Same idea, but keyed by userId — used before a Teacher profile exists
// yet (createTeacherHandler's scope check).
export async function getUserCampusIdsForRole(userId: string, roleName: string): Promise<string[]> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId, role: { name: roleName } },
    select: { campusId: true },
  });
  return userRoles.map((ur) => ur.campusId).filter((id): id is string => !!id);
}

// A Teacher profile always sits on top of an existing User with the
// TEACHER role (created via the Phase 0 Users API) — same pattern as
// Incharge scope's "user must already have the INCHARGE role" check.
export async function createTeacher(
  input: { userId: string; employeeCode?: string; qualification?: string; joiningDate?: Date; phone?: string; address?: string },
  actorId: string
) {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    include: { userRoles: { include: { role: true } } },
  });
  if (!user || !user.isActive) throw new HttpError(400, "USER_NOT_FOUND", "User not found or inactive");
  if (!user.userRoles.some((ur) => (ur.role.systemKey ?? ur.role.name) === "TEACHER")) {
    throw new HttpError(400, "USER_NOT_TEACHER", "User does not have the TEACHER role");
  }

  const existing = await prisma.teacher.findUnique({ where: { userId: input.userId } });
  if (existing) {
    throw new HttpError(409, "TEACHER_PROFILE_EXISTS", "This user already has a Teacher profile");
  }

  await assertStaffLimit();

  const teacher = await prisma.teacher.create({ data: input });

  await writeAuditLog({
    actorId,
    action: "CREATE",
    resource: "Teacher",
    recordId: teacher.id,
    newValue: { userId: input.userId, employeeCode: input.employeeCode },
  });

  return teacher;
}

export async function updateTeacher(
  id: string,
  input: Partial<{ employeeCode: string; qualification: string; joiningDate: Date; phone: string; address: string }>,
  actorId: string
) {
  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (!teacher) throw new HttpError(404, "TEACHER_NOT_FOUND", "Teacher not found");
  if (teacher.status === "ARCHIVED") throw new HttpError(409, "TEACHER_ARCHIVED", "Cannot edit an archived teacher");

  const updated = await prisma.teacher.update({ where: { id }, data: input });

  await writeAuditLog({
    actorId,
    action: "UPDATE",
    resource: "Teacher",
    recordId: id,
    oldValue: { employeeCode: teacher.employeeCode, qualification: teacher.qualification },
    newValue: { employeeCode: updated.employeeCode, qualification: updated.qualification },
  });

  return updated;
}

export async function archiveTeacher(id: string, actorId: string) {
  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (!teacher) throw new HttpError(404, "TEACHER_NOT_FOUND", "Teacher not found");
  if (teacher.status === "ARCHIVED") {
    throw new HttpError(409, "TEACHER_ALREADY_ARCHIVED", "Teacher is already archived");
  }

  const activeAssignment = await prisma.teacherAssignment.findFirst({
    where: { teacherId: id, archivedAt: null },
  });
  if (activeAssignment) {
    throw new HttpError(409, "TEACHER_HAS_ACTIVE_ASSIGNMENTS", "Cannot archive a teacher with active assignments");
  }

  const updated = await prisma.teacher.update({ where: { id }, data: { status: "ARCHIVED" } });

  await writeAuditLog({
    actorId,
    action: "ARCHIVE",
    resource: "Teacher",
    recordId: id,
    newValue: { status: updated.status },
  });

  return updated;
}
