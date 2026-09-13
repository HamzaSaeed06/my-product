import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Phase 0 seed: the 7 core roles from PRODUCT_SPEC.md §4, and the subset of
// permissions Phase 0 actually implements (users/roles/permissions, audit,
// approvals, documents, notifications). Every other permission
// (student.*, payment.*, result.*, ...) is seeded by the phase that actually
// builds that feature — don't guess ahead of the code that enforces it.
const CORE_ROLES = [
  "SUPER_ADMIN",
  "CAMPUS_HEAD",
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
  // Phase 11 Phase C — pre-enrollment stage, lighter-weight than a full
  // Admission (no Student row created until deliberately converted).
  ["admission_inquiry.view", "View admission inquiries"],
  ["admission_inquiry.create", "Create/update admission inquiries"],
  ["admission_inquiry.convert", "Convert an admission inquiry into a real Admission"],
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
  // Phase 11 Phase D — a lighter running log than Homework: no
  // draft/publish lifecycle, so one "create" permission covers create,
  // edit, and archive (matches the feature's own "lightweight" intent).
  ["class_diary.view", "View class diary entries"],
  ["class_diary.create", "Post/edit/archive a class diary entry"],
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

// Phase 8: Reports & Analytics. Every report is computed live from
// existing data — no new resource-specific permissions beyond "may view
// this report category" and "may export it" (a separate grant per spec's
// explicit view-vs-export split).
const PHASE_8_PERMISSIONS = [
  ["report.view_academic", "View academic reports"],
  ["report.view_attendance", "View attendance reports"],
  ["report.view_financial", "View financial reports"],
  ["report.view_admissions", "View admission reports"],
  ["report.view_staff", "View staff reports"],
  ["report.export", "Export report data"],
  // Not one of the report.view_X keys above deliberately — see the
  // comment on the route in reports/routes.ts. Not granted to any
  // non-SUPER_ADMIN role in this seed (SUPER_ADMIN gets it via the
  // blanket grant below).
  ["institute.monitor", "View the cross-campus institute monitoring dashboard"],
] as const;

// Phase 9: Online Payment Integration. payment_gateway.manage is
// deliberately separate from payment.view/payment.record — configuring
// which gateways are active (and generating their webhook secrets) is a
// sensitive setup action, not a day-to-day finance task.
const PHASE_9_PERMISSIONS = [
  ["payment_gateway.manage", "Manage online payment gateway configuration"],
  ["payment.pay_online", "Initiate an online payment for an invoice"],
] as const;

// Phase 11 Phase A2: Delegation. Deliberately only 3 keys — the
// SUPER_ADMIN-vs-CAMPUS_HEAD "who may create/revoke" rule from
// docs/PHASE_11_MULTI_CAMPUS_AND_WORKFLOWS.md is enforced by WHICH roles
// hold delegation.create/revoke (below), not by extra permission keys.
const PHASE_11_PERMISSIONS = [
  ["delegation.view", "View delegations"],
  ["delegation.create", "Grant a temporary role delegation"],
  ["delegation.revoke", "Revoke a delegation"],
  // Phase 11 Phase A3: Staff attendance with anti-spoofing verification.
  // staff_attendance.qr_manage is deliberately separate from .view — it's
  // "what gets printed/displayed", not attendance data, and must stay
  // restricted (see the comment on the route).
  ["staff_attendance.view", "View staff attendance/check-in records"],
  ["staff_attendance.checkin", "Self check-in via QR"],
  ["staff_attendance.mark", "Manually mark another staff member's attendance"],
  ["staff_attendance.remote_approve", "Grant a REMOTE_APPROVED day for legitimate remote work"],
  ["staff_attendance.qr_manage", "View the current QR check-in token to display/print"],
] as const;

const ALL_PERMISSIONS = [
  ...PHASE_0_PERMISSIONS,
  ...PHASE_1_PERMISSIONS,
  ...PHASE_2_PERMISSIONS,
  ...PHASE_3_PERMISSIONS,
  ...PHASE_4_PERMISSIONS,
  ...PHASE_5_PERMISSIONS,
  ...PHASE_6_PERMISSIONS,
  ...PHASE_8_PERMISSIONS,
  ...PHASE_9_PERMISSIONS,
  ...PHASE_11_PERMISSIONS,
];

// Phase 7: every non-SUPER_ADMIN role's permission grant, derived from
// PRODUCT_SPEC.md §"PHASE 7"'s "Screens Per Portal" list. Through Phase 6,
// only SUPER_ADMIN had any permissions at all (deliberately — "don't guess
// ahead of the code that enforces it"); every route gated by
// requirePermission() was therefore unreachable by any other role. This is
// what makes the other 6 portals actually usable for the first time.
// Route-level scope enforcement (a Teacher only sees their own sections, a
// Parent only their own children, ...) is separate and lives in
// src/lib/scope.ts — a permission grant here means "this role may use this
// endpoint at all", not "this role sees everyone's data".
const ROLE_PERMISSIONS: Record<Exclude<(typeof CORE_ROLES)[number], "SUPER_ADMIN">, string[]> = {
  // Campus Head (role name still "CAMPUS_HEAD" pending the Role.systemKey
  // rename discussed in docs/DYNAMIC_INSTITUTION_ARCHITECTURE.md Gap 2) —
  // full operational head of one campus. Per the user's explicit
  // 2026-09-12 decision (see docs/ROLE_PERMISSION_MATRIX.md): elevated
  // above Incharge/Office/Teacher, below Super Admin. This is Incharge's
  // + Office's campus-level authority, PLUS Campus Head's own exclusive
  // controls (class/section/subject/exam ownership, timetable publish,
  // gateway config) — deliberately NOT a blind copy of every Office/
  // Incharge grant: `user.create/edit/disable` (assign/manage staff) is
  // withheld until the Users module has real campus-scoping (no backend
  // guard exists yet — granting it today would let a Campus Head create a
  // SUPER_ADMIN account), and `payment.record` stays Office-exclusive
  // (segregation of duties: the approver of refunds/waivers/reversals
  // should not also be the one keying in daily cash).
  CAMPUS_HEAD: [
    "institute.view",
    "campus.view",
    "academic_year.view",
    // See own campus's staff (needed for the Incharge Scopes page and
    // generally to know who's on their campus) — read-only, now that
    // listUsers() is campus-scoped. user.create/edit/disable stay withheld
    // (see the big comment above this block).
    "user.view",
    // See own campus's Incharge scopes — matches
    // docs/ROLE_PERMISSION_MATRIX.md's "see (not necessarily edit)"
    // decision; create/edit/revoke stays Super-Admin-only for now.
    "incharge_scope.view",
    // Academic structure — Campus Head owns this for their campus, not
    // just views it (docs/ROLE_PERMISSION_MATRIX.md gap).
    "class.view",
    "class.create",
    "class.edit",
    "section.view",
    "section.create",
    "section.edit",
    "subject.view",
    "subject.create",
    "subject.edit",
    "student.view",
    "student.create",
    "student.edit",
    "student.archive",
    "parent.view",
    "parent.create",
    "parent.edit",
    "teacher.view",
    // Found 2026-09-13 auditing the Teachers page against real grants:
    // teachers/controller.ts already has campus-scoping logic written
    // specifically for "Campus Head/Office" creating/editing/archiving a
    // Teacher profile (a target user's TEACHER role must be at the actor's
    // own campus) — the enforcement existed, but the permission grant to
    // actually use it was never added, unlike user.create (withheld with a
    // stated reason: Users has no campus-scoping guard yet). No such
    // reason applies here, so this was a plain oversight, not a
    // deliberate withholding.
    "teacher.create",
    "teacher.edit",
    "teacher.archive",
    "teacher_assignment.view",
    "admission.view",
    "admission.create",
    "admission.approve",
    "admission.reject",
    "enrollment.view",
    "enrollment.create",
    "enrollment.transfer",
    "enrollment.withdraw",
    // Timetable/substitution — same operational authority as Incharge,
    // plus the publish step the spec reserves for Campus Head.
    "timetable.view",
    "timetable.create",
    "timetable.edit",
    "timetable.publish",
    "substitution.view",
    "substitution.create",
    "substitution.cancel",
    "attendance.view",
    "attendance.correct",
    "teacher_attendance.view",
    "curriculum.view",
    "curriculum.create",
    "curriculum.edit",
    "homework.view",
    "class_diary.view",
    "assessment.view",
    "assessment.correct",
    // Exams — Campus Head's own explicit authority per spec (Tests/Exams/
    // Exam schedules), not just Incharge-inherited oversight.
    "exam.view",
    "exam.create",
    "exam.publish",
    "result.view",
    "report_card.view",
    "promotion.view",
    "promotion.approve",
    // Finance — configuration/oversight authority, deliberately not
    // day-to-day cash entry (see comment above).
    "fee_structure.view",
    "fee_structure.create",
    "fee_structure.edit",
    "fee_assignment.view",
    "fee_assignment.create",
    "fee_assignment.edit",
    "invoice.view",
    "invoice.create",
    "invoice.void",
    "invoice.export",
    "payment.view",
    "payment.reverse",
    "refund.view",
    "refund.approve",
    "discount.view",
    "discount.approve",
    "waiver.view",
    "waiver.approve",
    "cash_closing.view",
    "cash_closing.approve",
    // Gateway config WITHHELD, unlike everything else in this block —
    // checked the schema while wiring the frontend (2026-09-12) and
    // PaymentGateway has NO campusId at all: it's one shared, institute-
    // wide gateway ("if more than one is active, the oldest active one is
    // used" — Phase 9's own design). Granting this to Campus Head would
    // let any one campus's head disable online payments for every other
    // campus. Re-add only once docs/DYNAMIC_INSTITUTION_ARCHITECTURE.md's
    // Gap 3 (FeatureConfig) exists to actually gate it, per the plan
    // already written in docs/ROLE_PERMISSION_MATRIX.md.
    "leave.view",
    "leave.approve",
    "leave.reject",
    "complaint.view",
    "complaint.assign",
    "audit.view",
    "approval.view",
    "approval.decide",
    "document.view",
    "document.upload",
    "document.manage",
    "notification.view",
    "report.view_academic",
    "report.view_attendance",
    "report.view_financial",
    "report.view_admissions",
    "report.view_staff",
    "report.export",
    // Own-campus only — enforced by assertCampusInScope in the delegations
    // controller, not by this grant alone.
    "delegation.view",
    "delegation.create",
    "delegation.revoke",
    "staff_attendance.view",
    "staff_attendance.checkin",
    "staff_attendance.mark",
    "staff_attendance.remote_approve",
    "staff_attendance.qr_manage",
  ],
  // Scoped class/section management — the permission grant is broad (same
  // shape as Teacher/Office for the resources Incharges touch); the
  // classes/sections/students it actually *returns* are narrowed by
  // checkInchargeScope() at the route level, not by a smaller permission
  // set here.
  INCHARGE: [
    "class.view",
    "section.view",
    // Both added 2026-09-13, found auditing the dashboard frontend against
    // this exact permission set: Incharge holds timetable.create/edit and
    // curriculum.edit below but had no way to fetch the subject list (GET
    // /api/v1/subjects → subject.view) or academic-year list (GET
    // /api/v1/academic-years → academic_year.view) those features filter
    // by — the Timetable subject picker rendered empty, and Curriculum's
    // class/year filter hit its "create a class and academic year first"
    // empty state even when both existed. Both are shared, non-sensitive
    // reference lists (no campus scoping on either endpoint) — unlike
    // campus.view, which stays withheld since Incharge's oversight is
    // deliberately section-scoped, not institute-wide.
    "subject.view",
    "academic_year.view",
    "exam.view",
    "student.view",
    "teacher.view",
    // Phase 11 Phase C: Incharge could not create an Enrollment (assign a
    // section) at all before this — Office was the only role that could.
    "enrollment.view",
    "enrollment.create",
    "admission_inquiry.view",
    "admission_inquiry.create",
    "admission_inquiry.convert",
    "timetable.view",
    "timetable.create",
    "timetable.edit",
    // Substitution was missing entirely (only CAMPUS_HEAD had .view) despite
    // Incharge already owning full timetable authority and the spec
    // explicitly listing "Teacher substitution" under Incharge — added
    // 2026-09-12 alongside the Campus Head permission expansion.
    "substitution.view",
    "substitution.create",
    "substitution.cancel",
    "attendance.view",
    "attendance.correct",
    "teacher_attendance.view",
    "curriculum.view",
    "curriculum.edit",
    "homework.view",
    "class_diary.view",
    "assessment.view",
    "assessment.correct",
    "result.view",
    "complaint.view",
    "complaint.assign",
    "leave.view",
    "leave.approve",
    "leave.reject",
    "notification.view",
    "report.view_academic",
    "report.view_attendance",
    "staff_attendance.view",
    "staff_attendance.checkin",
    "staff_attendance.mark",
  ],
  // Administrative staff: admissions, records, fee collection, leave/
  // complaint intake — per spec's "Office: administrative staff (admissions,
  // fees, records)".
  OFFICE: [
    "campus.view",
    "admission_inquiry.view",
    "admission_inquiry.create",
    "admission_inquiry.convert",
    "student.view",
    "student.create",
    "student.edit",
    "student.archive",
    "parent.view",
    "parent.create",
    "parent.edit",
    "teacher.view",
    // Same fix as Campus Head above: teachers/controller.ts already has
    // campus-scoped create/edit/archive logic written for Campus
    // Head/Office specifically — the grant to use it was just missing.
    "teacher.create",
    "teacher.edit",
    "teacher.archive",
    "class.view",
    "section.view",
    "academic_year.view",
    "admission.view",
    "admission.create",
    "admission.approve",
    "admission.reject",
    "enrollment.view",
    "enrollment.create",
    "enrollment.transfer",
    "enrollment.withdraw",
    "fee_structure.view",
    "fee_assignment.view",
    "fee_assignment.create",
    "fee_assignment.edit",
    "invoice.view",
    "invoice.create",
    "invoice.void",
    "invoice.export",
    "payment.view",
    "payment.record",
    "payment.reverse",
    "refund.view",
    "refund.create",
    "discount.view",
    "discount.create",
    "waiver.view",
    "waiver.create",
    "cash_closing.view",
    "cash_closing.create",
    "leave.view",
    "leave.approve",
    "leave.reject",
    "complaint.view",
    "complaint.create",
    "complaint.assign",
    "document.view",
    "document.upload",
    "document.manage",
    "notification.view",
    "report.view_financial",
    "report.view_admissions",
    "report.export",
    "staff_attendance.view",
    "staff_attendance.checkin",
    "staff_attendance.qr_manage",
  ],
  // Teaching staff: own classes' academics, attendance, homework, marks —
  // per spec's "Teacher: teaching staff (academics, attendance, homework)".
  // Which sections/students count as "own" is enforced by scope.ts, not by
  // this list.
  TEACHER: [
    "teacher_assignment.view",
    "enrollment.view",
    "timetable.view",
    "attendance.view",
    "attendance.mark",
    "teacher_attendance.view",
    "substitution.view",
    "curriculum.view",
    "curriculum.edit",
    "homework.view",
    "homework.create",
    "homework.edit",
    "homework.publish",
    "class_diary.view",
    "class_diary.create",
    "assessment.view",
    "assessment.create",
    "assessment.edit",
    "assessment.enter_marks",
    "assessment.submit",
    "exam.view",
    "result.view",
    "result.create",
    "result.edit",
    "student.view",
    "leave.view",
    "leave.create",
    "leave.cancel",
    // A Class Teacher (Section.classTeacherId) is the forwarding target for
    // leave requests per docs/PHASE_11_MULTI_CAMPUS_AND_WORKFLOWS.md Phase
    // B — added alongside Incharge's same grant, 2026-09-12.
    "leave.approve",
    "leave.reject",
    "document.view",
    "document.upload",
    "notification.view",
    "staff_attendance.checkin",
  ],
  // Guardian: view own children, pay fees, raise requests — per spec's
  // "Parent: student guardian (view children, pay fees, requests)". Read-
  // only everywhere except the requests it's allowed to initiate.
  PARENT: [
    "student.view",
    "timetable.view",
    "attendance.view",
    "homework.view",
    "class_diary.view",
    "assessment.view",
    "result.view",
    "report_card.view",
    "invoice.view",
    "payment.view",
    "payment.pay_online",
    "leave.view",
    "leave.create",
    "leave.cancel",
    "complaint.view",
    "complaint.create",
    "document.view",
    "notification.view",
  ],
  // Learner: view-only, per spec's explicit "Student Portal Specific: View-
  // only (no edits)".
  STUDENT: [
    "student.view",
    "timetable.view",
    "attendance.view",
    "homework.view",
    "class_diary.view",
    "assessment.view",
    "result.view",
    "report_card.view",
    "document.view",
    "notification.view",
  ],
};

async function main(): Promise<void> {
  // Phase 12 Gap 2: matched by systemKey, not name — name is now a freely
  // editable display label (an institute may have renamed "CAMPUS_HEAD" to
  // "Director"), so re-running this seed after a rename must find the same
  // existing row by its stable key, never create a confusing duplicate
  // system role under its original name. `update: {}` deliberately never
  // touches `name` — a rename must never be silently reverted by a seed run.
  for (const roleName of CORE_ROLES) {
    await prisma.role.upsert({
      where: { systemKey: roleName },
      update: {},
      create: { name: roleName, systemKey: roleName, isSystem: true },
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

  const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { systemKey: "SUPER_ADMIN" } });
  const allPermissions = await prisma.permission.findMany();

  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: permission.id },
    });
  }
  console.log(`Granted all ${allPermissions.length} permissions to SUPER_ADMIN.`);

  const permissionByKey = new Map(allPermissions.map((p) => [p.key, p.id]));

  for (const [roleName, keys] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.findUniqueOrThrow({ where: { systemKey: roleName } });
    for (const key of keys) {
      const permissionId = permissionByKey.get(key);
      if (!permissionId) throw new Error(`ROLE_PERMISSIONS['${roleName}'] references unknown permission key '${key}'`);
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } },
        update: {},
        create: { roleId: role.id, permissionId },
      });
    }
    console.log(`Granted ${keys.length} permissions to ${roleName}.`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
