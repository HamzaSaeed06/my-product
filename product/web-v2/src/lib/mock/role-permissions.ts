import { ALL_PERMISSIONS } from "./session";

// A pure join, replaced wholesale on save in the real backend (delete-all
// + recreate for that one role, not diffed/patched) — editing one role's
// permissions never touches another role's row.
export interface RolePermissionGrant {
  roleId: string;
  permission: string;
}

function grants(roleId: string, permissions: string[]): RolePermissionGrant[] {
  return permissions.map((permission) => ({ roleId, permission }));
}

const VIEW_ONLY = ALL_PERMISSIONS.filter((p) => p.endsWith(".view"));

export const mockRolePermissions: RolePermissionGrant[] = [
  ...grants("role_super_admin", ALL_PERMISSIONS),
  ...grants("role_campus_head", [
    ...VIEW_ONLY,
    "student.create", "student.edit", "teacher.create", "teacher.edit",
    "admission.approve", "admission.reject", "enrollment.create", "enrollment.transfer",
    "attendance.mark", "attendance.correct", "teacher_attendance.mark", "teacher_attendance.correct",
    "discount.approve", "waiver.approve", "refund.approve", "cash_closing.approve",
    "leave.approve", "complaint.assign", "complaint.resolve", "complaint.close",
  ]),
  ...grants("role_incharge", [
    ...VIEW_ONLY,
    "attendance.mark", "attendance.correct", "curriculum.edit", "homework.edit",
    "leave.approve", "complaint.assign",
  ]),
  ...grants("role_office", [
    ...VIEW_ONLY,
    "admission.create", "admission_inquiry.create", "admission_inquiry.convert",
    "invoice.create", "payment.record", "cash_closing.create",
    "discount.create", "waiver.create", "refund.create", "leave.create", "complaint.create",
  ]),
  ...grants("role_teacher", [
    "student.view", "attendance.view", "attendance.mark", "homework.view", "homework.create",
    "homework.publish", "class_diary.view", "class_diary.create", "assessment.view",
    "assessment.create", "assessment.enter_marks", "assessment.submit", "curriculum.view",
    "leave.view", "leave.create",
  ]),
  ...grants("role_exam_coordinator", [
    "exam.view", "exam.create", "exam.publish", "exam_schedule.view", "exam_schedule.create",
    "exam_schedule.edit", "result.view", "result.review", "result.finalize", "result.publish",
    "report_card.view", "report_card.generate",
  ]),
];
