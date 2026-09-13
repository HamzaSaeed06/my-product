export type EnrollmentStatus = "ACTIVE" | "TRANSFERRED" | "WITHDRAWN";

export interface Enrollment {
  id: string;
  studentId: string;
  academicYearId: string;
  classId: string;
  sectionId: string;
  rollNumber: string | null;
  status: EnrollmentStatus;
  enrolledAt: string;
  withdrawnAt: string | null;
}

// A student can have several Enrollment rows per academic year across
// transfers — only one may be ACTIVE at a time (service-layer rule, not a
// DB constraint, since history must stay queryable). Transferring creates
// a new row and marks the old one TRANSFERRED rather than mutating it in
// place.
export const mockEnrollments: Enrollment[] = [
  { id: "enr_1", studentId: "stu_0001", academicYearId: "ay_2026", classId: "cls_3", sectionId: "sec_1", rollNumber: "101", status: "ACTIVE", enrolledAt: "2026-06-05", withdrawnAt: null },
  { id: "enr_2", studentId: "stu_0002", academicYearId: "ay_2026", classId: "cls_5", sectionId: "sec_4", rollNumber: "205", status: "ACTIVE", enrolledAt: "2026-06-10", withdrawnAt: null },
  { id: "enr_3", studentId: "stu_0003", academicYearId: "ay_2025", classId: "cls_1", sectionId: "sec_6", rollNumber: "12", status: "TRANSFERRED", enrolledAt: "2025-06-01", withdrawnAt: "2026-06-01" },
  { id: "enr_4", studentId: "stu_0003", academicYearId: "ay_2026", classId: "cls_2", sectionId: "sec_7", rollNumber: "45", status: "ACTIVE", enrolledAt: "2026-06-01", withdrawnAt: null },
];
