import { getSectionRoster } from "./sections";

export type AssessmentStatus = "DRAFT" | "SUBMITTED";
export type CorrectionStatus = "PENDING" | "APPROVED" | "REJECTED";

// Internal, teacher-run formative check — a separate, independently-locked
// system from Exams/Results below, confirmed in the real backend (Result
// references Exam directly, never Assessment). Scoped like Curriculum:
// subject + section + class + academic year + teacher.
export interface Assessment {
  id: string;
  subjectId: string;
  sectionId: string;
  classId: string;
  academicYearId: string;
  teacherId: string;
  title: string;
  maxMarks: number;
  date: string;
  status: AssessmentStatus;
  archivedAt: string | null;
}

export interface AssessmentMark {
  id: string;
  assessmentId: string;
  studentId: string;
  marksObtained: number | null;
  remarks: string | null;
}

// Correction after SUBMITTED goes through approval (approver: Incharge) —
// same shape as Attendance's correction workflow from the prior batch.
export interface AssessmentCorrectionRequest {
  id: string;
  assessmentMarkId: string;
  requestedMarks: number;
  reason: string;
  status: CorrectionStatus;
  requestedById: string;
  requestedAt: string;
  decidedById: string | null;
  decidedAt: string | null;
}

// sec_2 (5 real students) — same section used across this whole batch, on
// purpose: sec_1 has zero students by the seeded generator's luck (caught
// in the prior batch), so every new roster-dependent page here defaults to
// a section that actually has students.
const sec2Roster = getSectionRoster("sec_2");

export const mockAssessments: Assessment[] = [
  { id: "as_1", subjectId: "sub_math", sectionId: "sec_2", classId: "cls_3", academicYearId: "ay_2026", teacherId: "tch_1", title: "Quiz 1 — Multiplication tables", maxMarks: 20, date: "2026-09-05", status: "SUBMITTED", archivedAt: null },
  { id: "as_2", subjectId: "sub_math", sectionId: "sec_2", classId: "cls_3", academicYearId: "ay_2026", teacherId: "tch_1", title: "Class test — Fractions", maxMarks: 25, date: "2026-09-14", status: "DRAFT", archivedAt: null },
];

export const mockAssessmentMarks: AssessmentMark[] = [
  ...sec2Roster.map((s, i) => ({ id: `am_1_${s.id}`, assessmentId: "as_1", studentId: s.id, marksObtained: 14 + i, remarks: null })),
  ...sec2Roster.map((s) => ({ id: `am_2_${s.id}`, assessmentId: "as_2", studentId: s.id, marksObtained: null, remarks: null })),
];

export const mockAssessmentCorrections: AssessmentCorrectionRequest[] = [
  {
    id: "amc_1",
    assessmentMarkId: mockAssessmentMarks[1]?.id ?? "",
    requestedMarks: 18,
    reason: "Re-checked the paper — question 4 was marked wrong but the working was correct.",
    status: "PENDING",
    requestedById: "usr_teacher_1",
    requestedAt: "2026-09-06T10:00:00",
    decidedById: null,
    decidedAt: null,
  },
];
