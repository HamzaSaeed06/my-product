export type AdmissionStatus = "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN";

export interface Admission {
  id: string;
  studentId: string;
  campusId: string;
  classId: string;
  academicYearId: string;
  status: AdmissionStatus;
  appliedAt: string;
  decisionNote: string | null;
}

// All three non-PENDING states are terminal — a rejected applicant
// reapplies as a brand-new Admission row, never a status flip back to
// PENDING (the real backend enforces this: decideAdmission/
// withdrawAdmission both refuse if status isn't already PENDING).
// Approving here does NOT create an Enrollment — "Admission ≠ Enrollment"
// is a deliberate rule this UI states outright, not an implementation gap.
export const mockAdmissions: Admission[] = [
  { id: "adm_1", studentId: "stu_0001", campusId: "cmp_main", classId: "cls_3", academicYearId: "ay_2026", status: "PENDING", appliedAt: "2026-09-10", decisionNote: null },
  { id: "adm_2", studentId: "stu_0002", campusId: "cmp_main", classId: "cls_5", academicYearId: "ay_2026", status: "APPROVED", appliedAt: "2026-08-20", decisionNote: null },
  { id: "adm_3", studentId: "stu_0003", campusId: "cmp_north", academicYearId: "ay_2026", classId: "cls_1", status: "REJECTED", appliedAt: "2026-08-15", decisionNote: "Class 1 already at capacity for this campus." },
  { id: "adm_4", studentId: "stu_0004", campusId: "cmp_riverside", classId: "cls_4", academicYearId: "ay_2026", status: "WITHDRAWN", appliedAt: "2026-08-01", decisionNote: null },
];
