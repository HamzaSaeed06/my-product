// The portal is gated by raw role membership in the real backend
// (profile.roles.includes("TEACHER"/"PARENT"/"STUDENT")), not the
// granular permission system the admin dashboard uses — confirmed a
// completely separate auth path. Phase B fixes one demo identity per role
// rather than wiring real session switching; a persona switcher in the
// portal header (review-time only, same spirit as the design-system
// switcher) lets every role's pages be reviewed without three logins.
export type PortalRole = "TEACHER" | "PARENT" | "STUDENT";

// tch_1 teaches sec_1 AND sec_2 (teacher-assignments.ts) — sec_2 is used
// as the default "my section" everywhere below since sec_1 has zero real
// students by the seeded generator's luck (the same lesson from the
// Academic Operations batch, applied here too).
export const PORTAL_DEMO = {
  teacherId: "tch_1",
  teacherUserId: "usr_teacher_1",
  teacherSectionId: "sec_2",
  parentId: "par_4",
  // The Student persona is literally one of the demo Parent's own
  // children, so switching personas shows the same underlying student
  // from two different vantage points. stu_0191 has a PUBLISHED result
  // (visible in Results) and a generated report card — the child to look
  // at for those two pages. Switch to the second linked child (stu_0148,
  // FINALIZED-but-not-yet-published, an UNPAID invoice) to see the Fees
  // pay-online flow instead.
  studentId: "stu_0191",
};
