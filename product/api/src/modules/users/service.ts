import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { hashPassword, isPasswordPolicyCompliant } from "../../lib/password.js";
import { revokeAllSessions } from "../auth/service.js";
import { HttpError } from "../../middleware/errorHandler.js";

function toPublic(user: {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  mfaEnabled: boolean;
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    isActive: user.isActive,
    mfaEnabled: user.mfaEnabled,
    createdAt: user.createdAt,
  };
}

export async function listUsers(campusIdIn?: string[]) {
  const users = await prisma.user.findMany({
    // A user's "campus" is any UserRole they hold with a campusId in it —
    // Campus Head/Office see only users who have at least one role at
    // their own campus(es). See
    // docs/PHASE_11A_CAMPUS_SCOPING_IMPLEMENTATION_PLAN.md Group 3.
    where: campusIdIn ? { userRoles: { some: { campusId: { in: campusIdIn } } } } : undefined,
    include: { userRoles: { include: { role: true } } },
    orderBy: { createdAt: "desc" },
  });

  return users.map((user) => ({
    ...toPublic(user),
    roles: user.userRoles.map((ur) => ({
      userRoleId: ur.id,
      roleId: ur.roleId,
      roleName: ur.role.name,
      campusId: ur.campusId,
    })),
  }));
}

export async function createUser(
  input: { email: string; password: string; fullName: string },
  actorId: string
) {
  if (!isPasswordPolicyCompliant(input.password)) {
    throw new HttpError(
      400,
      "WEAK_PASSWORD",
      "Password must be 8+ characters with upper, lower, number, and special character"
    );
  }

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new HttpError(409, "EMAIL_IN_USE", "A user with this email already exists");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: { email: input.email, passwordHash, fullName: input.fullName },
  });

  await writeAuditLog({
    actorId,
    action: "CREATE",
    resource: "User",
    recordId: user.id,
    newValue: { email: user.email, fullName: user.fullName },
  });

  return toPublic(user);
}

export async function updateUser(
  userId: string,
  input: { fullName?: string; email?: string },
  actorId: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, "USER_NOT_FOUND", "User not found");

  const updated = await prisma.user.update({ where: { id: userId }, data: input });

  await writeAuditLog({
    actorId,
    action: "UPDATE",
    resource: "User",
    recordId: userId,
    oldValue: { fullName: user.fullName, email: user.email },
    newValue: { fullName: updated.fullName, email: updated.email },
  });

  return toPublic(updated);
}

// Disabling immediately revokes all sessions — a disabled account shouldn't
// keep working off an already-issued access token, per PRODUCT_SPEC.md §8.
export async function setUserActive(userId: string, isActive: boolean, actorId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, "USER_NOT_FOUND", "User not found");

  const updated = await prisma.user.update({ where: { id: userId }, data: { isActive } });

  if (!isActive) {
    await revokeAllSessions(userId);
  }

  await writeAuditLog({
    actorId,
    action: isActive ? "ENABLE" : "DISABLE",
    resource: "User",
    recordId: userId,
    oldValue: { isActive: user.isActive },
    newValue: { isActive: updated.isActive },
  });

  return toPublic(updated);
}

// Role changes invalidate all sessions (PRODUCT_SPEC.md §8: "Role change
// invalidates all active sessions") so a user can't keep acting under
// permissions computed from their old role set until their token expires.
export async function assignRole(
  userId: string,
  roleId: string,
  campusId: string | null,
  actorId: string
) {
  const [user, role] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.role.findUnique({ where: { id: roleId } }),
  ]);
  if (!user) throw new HttpError(404, "USER_NOT_FOUND", "User not found");
  if (!role || role.archivedAt) throw new HttpError(404, "ROLE_NOT_FOUND", "Role not found or archived");

  // CAMPUS_HEAD/OFFICE are campus-scoped roles (docs/PHASE_11_MULTI_CAMPUS_
  // AND_WORKFLOWS.md Phase A) — a no-campus assignment would be a data-
  // entry mistake, not a valid "unscoped" state, since lib/scope.ts now
  // derives their entire visibility from this field. Service-layer check,
  // not a DB constraint, since campusId must stay nullable for every other
  // role.
  const roleKey = role.systemKey ?? role.name;
  if ((roleKey === "CAMPUS_HEAD" || roleKey === "OFFICE") && !campusId) {
    throw new HttpError(400, "CAMPUS_REQUIRED_FOR_ROLE", `${role.name} must be assigned with a campusId`);
  }
  if (campusId) {
    const campus = await prisma.campus.findUnique({ where: { id: campusId } });
    if (!campus || campus.archivedAt) throw new HttpError(400, "CAMPUS_NOT_FOUND", "Campus not found or archived");
  }

  // findFirst, not findUnique on the compound key: Postgres treats NULL as
  // distinct in unique indexes, so the DB constraint alone wouldn't catch a
  // duplicate no-campus assignment — this explicit check does.
  const existing = await prisma.userRole.findFirst({
    where: { userId, roleId, campusId },
  });
  if (existing) {
    throw new HttpError(409, "ROLE_ALREADY_ASSIGNED", "User already has this role in this scope");
  }

  const userRole = await prisma.userRole.create({
    data: { userId, roleId, campusId, createdBy: actorId },
  });

  await revokeAllSessions(userId);

  await writeAuditLog({
    actorId,
    action: "ASSIGN_ROLE",
    resource: "UserRole",
    recordId: userRole.id,
    newValue: { userId, roleName: role.name, campusId },
  });

  return userRole;
}

export async function removeRole(userId: string, userRoleId: string, actorId: string) {
  const userRole = await prisma.userRole.findUnique({ where: { id: userRoleId }, include: { role: true } });
  if (!userRole || userRole.userId !== userId) {
    throw new HttpError(404, "USER_ROLE_NOT_FOUND", "Role assignment not found for this user");
  }

  await prisma.userRole.delete({ where: { id: userRoleId } });
  await revokeAllSessions(userId);

  await writeAuditLog({
    actorId,
    action: "REMOVE_ROLE",
    resource: "UserRole",
    recordId: userRoleId,
    oldValue: { userId, roleName: userRole.role.name, campusId: userRole.campusId },
  });
}
