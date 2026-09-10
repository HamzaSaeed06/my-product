import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Phase 0 seed: the 7 core roles from PRODUCT_SPEC.md §4, and the subset of
// permissions Phase 0 actually implements (users/roles/permissions, audit,
// approvals, documents, notifications). Every other permission
// (student.*, payment.*, result.*, ...) is seeded by the phase that actually
// builds that feature — don't guess ahead of the code that enforces it.
const CORE_ROLES = [
  "SUPER_ADMIN",
  "PRINCIPAL",
  "INCHARGE",
  "OFFICE",
  "TEACHER",
  "PARENT",
  "STUDENT",
] as const;

const PHASE_0_PERMISSIONS = [
  ["user.view", "View user accounts"],
  ["user.create", "Create user accounts"],
  ["user.edit", "Edit user accounts"],
  ["user.disable", "Disable user accounts"],
  ["role.view", "View roles"],
  ["role.create", "Create roles"],
  ["role.edit", "Edit roles"],
  ["role.archive", "Archive roles"],
  ["role.assign_permissions", "Assign permissions to a role"],
  ["permission.manage", "Manage the permission catalog"],
  ["audit.view", "View audit logs"],
  ["audit.export", "Export audit logs"],
  ["approval.view", "View approval requests"],
  ["approval.decide", "Approve or reject approval requests"],
  ["document.view", "View documents"],
  ["document.upload", "Upload documents"],
  ["document.manage", "Manage document metadata/permissions"],
  ["notification.view", "View own notifications"],
  ["notification.manage", "Manage notification templates/preferences"],
] as const;

async function main(): Promise<void> {
  for (const roleName of CORE_ROLES) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName, isSystem: true },
    });
  }
  console.log(`Seeded ${CORE_ROLES.length} core roles.`);

  for (const [key, description] of PHASE_0_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key },
      update: { description },
      create: { key, description },
    });
  }
  console.log(`Seeded ${PHASE_0_PERMISSIONS.length} Phase 0 permissions.`);

  const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { name: "SUPER_ADMIN" } });
  const allPermissions = await prisma.permission.findMany();

  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: permission.id },
    });
  }
  console.log(`Granted all ${allPermissions.length} Phase 0 permissions to SUPER_ADMIN.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
