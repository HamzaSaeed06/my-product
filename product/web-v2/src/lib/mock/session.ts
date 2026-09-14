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
  "admission.create",
  "admission.approve",
  "admission.reject",
  "admission_inquiry.view",
  "admission_inquiry.create",
  "admission_inquiry.convert",
  // Not confirmed backend permission names (Enrollment has no dedicated
  // old-frontend page or documented permission string — it's only two
  // dialogs on the Student detail page there) — named to match this
  // codebase's own <resource>.<action> convention.
  "enrollment.view",
  "enrollment.create",
  "enrollment.transfer",
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
  "timetable.create",
  "timetable.edit",
  "timetable.publish",
  "attendance.view",
  "attendance.mark",
  "attendance.correct",
  "teacher_attendance.view",
  "teacher_attendance.mark",
  "teacher_attendance.correct",
  // Deliberately separate from teacher_attendance — a check-in/verification
  // record covering all staff (Campus Head/Incharge/Office too, not just
  // Teachers), confirmed distinct entities in the real backend's own schema
  // comment. qr_manage is its own permission since the QR token is what
  // gets displayed/printed at reception — security-sensitive beyond plain view.
  "staff_attendance.view",
  "staff_attendance.checkin",
  "staff_attendance.mark",
  "staff_attendance.remote_approve",
  "staff_attendance.qr_manage",
  "substitution.view",
  "substitution.create",
  "substitution.cancel",
  "curriculum.view",
  "curriculum.create",
  "curriculum.edit",
  "homework.view",
  "homework.create",
  "homework.edit",
  "homework.publish",
  // class_diary.create is reused for create, update, AND archive in the
  // real backend (all three routes share this one string) — there is no
  // separate .edit permission here, confirmed from routes.ts.
  "class_diary.view",
  "class_diary.create",
  "assessment.view",
  "assessment.create",
  "assessment.enter_marks",
  "assessment.submit",
  "assessment.edit",
  "assessment.correct",
  "exam.view",
  "exam.create",
  "exam.publish",
  // Its own module/permission set in the real backend even though this UI
  // nests the "add paper" action inside the exam detail page rather than
  // giving it a standalone list route.
  "exam_schedule.view",
  "exam_schedule.create",
  "exam_schedule.edit",
  "result.view",
  "result.edit",
  "result.review",
  "result.finalize",
  "result.publish",
  "result.correct",
  "report_card.view",
  "report_card.generate",
  "promotion.view",
  "promotion.create",
  "promotion.approve",
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
