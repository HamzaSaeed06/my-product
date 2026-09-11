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

// Phase 3: Timetable, Attendance, Substitution, Curriculum, Homework,
// Assessments. `*.correct` permissions gate DECIDING a correction request
// (Incharge/Principal), separate from the `.mark`/`.enter_marks` permission
// that gates REQUESTING one (Teacher) — see attendance/service.ts and
// assessments/service.ts.
const PHASE_3_PERMISSIONS = [
  ["timetable.view", "View timetables"],
  ["timetable.create", "Create/edit timetable entries"],
  ["timetable.edit", "Edit timetable entries"],
  ["timetable.publish", "Publish a timetable"],
  ["attendance.view", "View student attendance"],
  ["attendance.mark", "Mark student attendance"],
  ["attendance.correct", "Decide student attendance correction requests"],
  ["teacher_attendance.view", "View teacher attendance"],
  ["teacher_attendance.mark", "Mark teacher attendance"],
  ["teacher_attendance.correct", "Correct teacher attendance"],
  ["substitution.view", "View substitutions"],
  ["substitution.create", "Assign a substitute teacher"],
  ["substitution.cancel", "Cancel a substitution"],
  ["curriculum.view", "View curriculum/syllabus"],
  ["curriculum.create", "Create curriculum topics"],
  ["curriculum.edit", "Edit curriculum topics / mark progress"],
  ["homework.view", "View homework"],
  ["homework.create", "Create homework"],
  ["homework.edit", "Edit homework"],
  ["homework.publish", "Publish homework"],
  ["assessment.view", "View assessments/tests"],
  ["assessment.create", "Create assessments/tests"],
  ["assessment.edit", "Edit assessments/tests"],
  ["assessment.enter_marks", "Enter/request-correction of assessment marks"],
  ["assessment.submit", "Submit (lock) an assessment's marks"],
  ["assessment.correct", "Decide assessment marks correction requests"],
] as const;

// Phase 4: Exams, Result workflow, Report cards, Promotion. `result.correct`
// gates DECIDING a result correction request, separate from the `.edit`
// permission that gates REQUESTING one — same split as Phase 3's
// `*.correct` permissions.
const PHASE_4_PERMISSIONS = [
  ["exam.view", "View exams"],
  ["exam.create", "Create exams"],
  ["exam.edit", "Edit exams and exam schedules"],
  ["exam.publish", "Publish an exam schedule"],
  ["exam_schedule.view", "View exam schedules"],
  ["exam_schedule.create", "Create exam schedule entries"],
  ["exam_schedule.edit", "Edit exam schedule entries"],
  ["result.view", "View results"],
  ["result.create", "Create/enter results"],
  ["result.edit", "Edit results (draft) and submit for review"],
  ["result.review", "Review submitted results"],
  ["result.finalize", "Finalize (lock) reviewed results"],
  ["result.publish", "Publish finalized results"],
  ["result.correct", "Decide result correction requests"],
  ["report_card.view", "View report cards"],
  ["report_card.generate", "Generate report cards"],
  ["promotion.view", "View promotion decisions"],
  ["promotion.create", "Create promotion decisions"],
  ["promotion.approve", "Approve class-jump promotion decisions"],
] as const;

// Phase 5: Finance Module. Per spec's permission list verbatim.
const PHASE_5_PERMISSIONS = [
  ["fee_structure.view", "View fee structures"],
  ["fee_structure.create", "Create fee structures"],
  ["fee_structure.edit", "Edit/archive fee structures"],
  ["fee_assignment.view", "View student fee assignments"],
  ["fee_assignment.create", "Assign a fee structure to a student"],
  ["fee_assignment.edit", "Edit/archive a student fee assignment"],
  ["invoice.view", "View invoices"],
  ["invoice.create", "Generate invoices"],
  ["invoice.void", "Void invoices"],
  ["invoice.export", "Export invoice/financial reports"],
  ["payment.view", "View payments"],
  ["payment.record", "Record payments"],
  ["payment.reverse", "Request/decide payment reversals"],
  ["refund.view", "View refunds"],
  ["refund.create", "Request refunds"],
  ["refund.approve", "Approve/reject refunds"],
  ["discount.view", "View discounts"],
  ["discount.create", "Request discounts"],
  ["discount.approve", "Approve/reject discounts"],
  ["waiver.view", "View waivers"],
  ["waiver.create", "Request waivers"],
  ["waiver.approve", "Approve/reject waivers"],
  ["cash_closing.view", "View cash closings"],
  ["cash_closing.create", "Create a cash closing"],
  ["cash_closing.approve", "Approve a cash closing"],
] as const;

// Phase 6: Operations (Leave, Complaints). Document/Notification
// permissions are already seeded in Phase 0 and reused here.
const PHASE_6_PERMISSIONS = [
  ["leave.view", "View leave requests"],
  ["leave.create", "Request leave"],
  ["leave.approve", "Approve leave requests"],
  ["leave.reject", "Reject leave requests"],
  ["leave.cancel", "Cancel a leave request"],
  ["complaint.view", "View complaints"],
  ["complaint.create", "Submit a complaint"],
  ["complaint.assign", "Assign a complaint to staff"],
  ["complaint.resolve", "Resolve a complaint"],
  ["complaint.close", "Close a resolved complaint"],
] as const;

const ALL_PERMISSIONS = [
  ...PHASE_0_PERMISSIONS,
  ...PHASE_1_PERMISSIONS,
  ...PHASE_2_PERMISSIONS,
  ...PHASE_3_PERMISSIONS,
  ...PHASE_4_PERMISSIONS,
  ...PHASE_5_PERMISSIONS,
  ...PHASE_6_PERMISSIONS,
];

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
