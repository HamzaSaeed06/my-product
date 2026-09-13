import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";

export async function listRoles() {
  const roles = await prisma.role.findMany({
    include: { rolePermissions: { include: { permission: true } } },
    orderBy: { name: "asc" },
  });

  return roles.map((role) => ({
    id: role.id,
    name: role.name,
    // Phase 12 Gap 2 — null for a custom, institute-defined role. Exposed
    // so a future frontend can tell "this is one of the 7 system roles,
    // renamed" apart from "this is a genuinely custom role" without
    // guessing from the (now arbitrary) display name.
    systemKey: role.systemKey,
    description: role.description,
    isSystem: role.isSystem,
    archivedAt: role.archivedAt,
    permissions: role.rolePermissions.map((rp) => rp.permission.key),
  }));
}

export async function createRole(input: { name: string; description?: string }, actorId: string) {
  const existing = await prisma.role.findUnique({ where: { name: input.name } });
  if (existing) {
    throw new HttpError(409, "ROLE_EXISTS", `A role named "${input.name}" already exists`);
  }

  const role = await prisma.role.create({
    data: { name: input.name, description: input.description, isSystem: false },
  });

  await writeAuditLog({
    actorId,
    action: "CREATE",
    resource: "Role",
    recordId: role.id,
    newValue: { name: role.name, description: role.description },
  });

  return role;
}

// Phase 12 Gap 2: renaming `name` — including for one of the 7 system
// roles — is exactly the capability this whole systemKey migration exists
// to make safe. `systemKey` is never part of `input`, so it can never be
// touched here regardless of what a caller sends.
export async function updateRole(
  roleId: string,
  input: { name?: string; description?: string },
  actorId: string
) {
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) throw new HttpError(404, "ROLE_NOT_FOUND", "Role not found");
  if (role.archivedAt) throw new HttpError(409, "ROLE_ARCHIVED", "Cannot edit an archived role");

  if (input.name && input.name !== role.name) {
    const existing = await prisma.role.findUnique({ where: { name: input.name } });
    if (existing) throw new HttpError(409, "ROLE_EXISTS", `A role named "${input.name}" already exists`);
  }

  const updated = await prisma.role.update({
    where: { id: roleId },
    data: { name: input.name, description: input.description },
  });

  await writeAuditLog({
    actorId,
    action: "UPDATE",
    resource: "Role",
    recordId: roleId,
    oldValue: { name: role.name, description: role.description },
    newValue: { name: updated.name, description: updated.description },
  });

  return updated;
}

export async function archiveRole(roleId: string, actorId: string) {
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) throw new HttpError(404, "ROLE_NOT_FOUND", "Role not found");
  if (role.isSystem) {
    throw new HttpError(403, "ROLE_IS_SYSTEM", "Cannot archive one of the 7 core system roles");
  }
  if (role.archivedAt) {
    throw new HttpError(409, "ROLE_ALREADY_ARCHIVED", "Role is already archived");
  }

  const inUse = await prisma.userRole.findFirst({ where: { roleId } });
  if (inUse) {
    throw new HttpError(
      409,
      "ROLE_IN_USE",
      "Cannot archive a role that is still assigned to at least one user"
    );
  }

  const updated = await prisma.role.update({ where: { id: roleId }, data: { archivedAt: new Date() } });

  await writeAuditLog({
    actorId,
    action: "ARCHIVE",
    resource: "Role",
    recordId: roleId,
    oldValue: { archivedAt: null },
    newValue: { archivedAt: updated.archivedAt },
  });

  return updated;
}

// Sets a role's permission set to exactly `permissionKeys` (replace, not
// append) — the natural shape for a "permissions" checklist UI. Diffed and
// audited so the audit log shows exactly what was added/removed, per
// PRODUCT_SPEC.md §8 ("Permission changed" is a MUST-AUDIT system event).
export async function setRolePermissions(roleId: string, permissionKeys: string[], actorId: string) {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: { rolePermissions: { include: { permission: true } } },
  });
  if (!role) throw new HttpError(404, "ROLE_NOT_FOUND", "Role not found");
  if (role.archivedAt) throw new HttpError(409, "ROLE_ARCHIVED", "Cannot edit an archived role");

  const permissions = await prisma.permission.findMany({ where: { key: { in: permissionKeys } } });
  const foundKeys = new Set(permissions.map((p) => p.key));
  const missing = permissionKeys.filter((key) => !foundKeys.has(key));
  if (missing.length > 0) {
    throw new HttpError(400, "UNKNOWN_PERMISSIONS", `Unknown permission key(s): ${missing.join(", ")}`);
  }

  const oldKeys = role.rolePermissions.map((rp) => rp.permission.key).sort();
  const newKeys = [...permissionKeys].sort();

  await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { roleId } }),
    prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId, permissionId: p.id })),
    }),
  ]);

  await writeAuditLog({
    actorId,
    action: "UPDATE",
    resource: "RolePermission",
    recordId: roleId,
    oldValue: { permissions: oldKeys },
    newValue: { permissions: newKeys },
  });

  return newKeys;
}

export async function listPermissions() {
  return prisma.permission.findMany({ orderBy: { key: "asc" } });
}
