// Phase A/B mock session — shaped exactly like the real GET /api/v1/auth/me
// response (see product/web/src/lib/session.ts) so wiring Phase C only means
// swapping this constant for a real fetch, not restructuring consumers.
export interface Viewer {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
  permissions: string[];
  /** Present only for section/campus-scoped roles (Incharge, Teacher). */
  scope?: {
    campusId: string;
    campusName: string;
  };
}

export const ALL_PERMISSIONS = [
  "user.view",
  "user.create",
  "user.edit",
  "user.disable",
  "role.view",
  "institute.view",
  "institute.edit",
  "institute.configure",
  "campus.view",
  "campus.create",
  "campus.edit",
  "campus.archive",
  "academic_year.view",
  "academic_year.create",
  "academic_year.edit",
  "academic_year.close",
  "class.view",
  "class.create",
  "class.edit",
  "class.archive",
  "section.view",
  "section.create",
  "section.edit",
  "section.archive",
  "incharge_scope.view",
  "incharge_scope.create",
  "incharge_scope.edit",
  "incharge_scope.revoke",
  "delegation.view",
  "delegation.create",
  "delegation.revoke",
  // Not a confirmed backend permission name (Feature Config has no old
  // frontend or documented permission string to check against) — named to
  // match this codebase's own `<resource>.<action>` convention.
  "feature_config.manage",
  "student.view",
  "student.create",
  "student.edit",
  "admission.view",
  "parent.view",
  "parent.create",
  "parent.edit",
  "teacher.view",
  "teacher.create",
  "teacher.edit",
  "teacher.archive",
  "teacher_assignment.view",
  "teacher_assignment.create",
  "teacher_assignment.edit",
  "subject.view",
  "subject.create",
  "subject.edit",
  "subject.archive",
  "timetable.view",
  "attendance.view",
  "teacher_attendance.view",
  "substitution.view",
  "curriculum.view",
  "homework.view",
  "assessment.view",
  "exam.view",
  "result.view",
  "report_card.view",
  "promotion.view",
  "fee_structure.view",
  "fee_assignment.view",
  "invoice.view",
  "payment.view",
  "refund.view",
  "discount.view",
  "waiver.view",
  "cash_closing.view",
  "payment_gateway.manage",
  "leave.view",
  "complaint.view",
  "report.view_academic",
  "report.view_attendance",
  "report.view_financial",
  "report.view_admissions",
  "report.view_staff",
];

// Demo viewer for the design-review phase: Super Admin, full permission set.
// Phase B will add a role switcher fixture once every page exists, so
// scoped-role behavior (Incharge/Teacher campus pickers) can be reviewed
// screen-by-screen too.
export const mockViewer: Viewer = {
  id: "usr_demo_super_admin",
  fullName: "Ayesha Raza",
  email: "ayesha.raza@risecampus.edu",
  roles: ["SUPER_ADMIN"],
  permissions: ALL_PERMISSIONS,
};
