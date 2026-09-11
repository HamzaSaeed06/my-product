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

// Phase 1: Institute/Campus/AcademicYear/Class/Section + Incharge scopes.
const PHASE_1_PERMISSIONS = [
  ["institute.view", "View institute configuration"],
  ["institute.edit", "Edit institute profile"],
  ["institute.configure", "Configure institute settings (timezone, terminology, ...)"],
  ["campus.view", "View campuses"],
  ["campus.create", "Create campuses"],
  ["campus.edit", "Edit campuses"],
  ["campus.archive", "Archive campuses"],
  ["academic_year.view", "View academic years"],
  ["academic_year.create", "Create academic years"],
  ["academic_year.edit", "Edit academic years"],
  ["academic_year.close", "Close academic years"],
  ["class.view", "View classes"],
  ["class.create", "Create classes"],
  ["class.edit", "Edit classes"],
  ["class.archive", "Archive classes"],
  ["section.view", "View sections"],
  ["section.create", "Create sections"],
  ["section.edit", "Edit sections"],
  ["section.archive", "Archive sections"],
  ["incharge_scope.view", "View Incharge scope assignments"],
  ["incharge_scope.create", "Create Incharge scope assignments"],
  ["incharge_scope.edit", "Edit Incharge scope assignments"],
  ["incharge_scope.revoke", "Revoke Incharge scope assignments"],
] as const;

// Phase 2: Student/Parent/Teacher/Subject/Admission/Enrollment.
const PHASE_2_PERMISSIONS = [
  ["student.view", "View students"],
  ["student.create", "Create students"],
  ["student.edit", "Edit students"],
  ["student.archive", "Archive/withdraw students"],
  ["parent.view", "View parents/guardians"],
  ["parent.create", "Create parents/guardians"],
  ["parent.edit", "Edit parents/guardians"],
  ["teacher.view", "View teachers"],
  ["teacher.create", "Create teachers"],
  ["teacher.edit", "Edit teachers"],
  ["teacher.archive", "Archive teachers"],
  ["subject.view", "View subjects"],
  ["subject.create", "Create subjects"],
  ["subject.edit", "Edit subjects"],
  ["subject.archive", "Archive subjects"],
  ["admission.view", "View admission applications"],
  ["admission.create", "Create admission applications"],
  ["admission.approve", "Approve admission applications"],
  ["admission.reject", "Reject admission applications"],
  ["enrollment.view", "View enrollments"],
  ["enrollment.create", "Create enrollments"],
  ["enrollment.transfer", "Transfer a student's class/section"],
  ["enrollment.withdraw", "Withdraw an enrollment"],
  ["teacher_assignment.view", "View teacher assignments"],
  ["teacher_assignment.create", "Create teacher assignments"],
  ["teacher_assignment.edit", "Edit teacher assignments"],
] as const;

const ALL_PERMISSIONS = [...PHASE_0_PERMISSIONS, ...PHASE_1_PERMISSIONS, ...PHASE_2_PERMISSIONS];

async function main(): Promise<void> {
  for (const roleName of CORE_ROLES) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName, isSystem: true },
    });
  }
  console.log(`Seeded ${CORE_ROLES.length} core roles.`);

  for (const [key, description] of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key },
      update: { description },
      create: { key, description },
    });
  }
  console.log(`Seeded ${ALL_PERMISSIONS.length} permissions.`);

  const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { name: "SUPER_ADMIN" } });
  const allPermissions = await prisma.permission.findMany();

  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: permission.id },
    });
  }
  console.log(`Granted all ${allPermissions.length} permissions to SUPER_ADMIN.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
