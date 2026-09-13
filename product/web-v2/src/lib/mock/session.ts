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
  "institute.view",
  "campus.view",
  "academic_year.view",
  "class.view",
  "section.view",
  "incharge_scope.view",
  "student.view",
  "student.create",
  "student.edit",
  "admission.view",
  "parent.view",
  "teacher.view",
  "teacher_assignment.view",
  "subject.view",
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
