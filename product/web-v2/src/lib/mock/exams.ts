export type ExamStatus = "DRAFT" | "PUBLISHED";

// A named series per academic year ("Midterm", "Final Term") — unique on
// [academicYearId, name] in the real backend.
export interface Exam {
  id: string;
  name: string;
  academicYearId: string;
  status: ExamStatus;
}

// One-to-many with Exam (an exam has many papers), its own module and
// permission set in the real backend — not merged into Exam even though
// this UI nests it inside the exam detail page rather than giving it a
// standalone list route.
export interface ExamSchedule {
  id: string;
  examId: string;
  sectionId: string;
  subjectId: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string | null;
}

export const mockExams: Exam[] = [
  { id: "exam_1", name: "Midterm", academicYearId: "ay_2026", status: "PUBLISHED" },
  { id: "exam_2", name: "Final Term", academicYearId: "ay_2026", status: "DRAFT" },
];

// Both scoped to sec_2 (real students) — unique on [examId, sectionId,
// subjectId] in the real backend; overlap is checked service-side (no two
// papers for the same section can overlap in time on the same date).
export const mockExamSchedules: ExamSchedule[] = [
  { id: "es_1", examId: "exam_1", sectionId: "sec_2", subjectId: "sub_math", date: "2026-09-20", startTime: "09:00", endTime: "10:30", room: "Room 12" },
  { id: "es_2", examId: "exam_1", sectionId: "sec_2", subjectId: "sub_english", date: "2026-09-22", startTime: "09:00", endTime: "10:30", room: "Room 12" },
  { id: "es_3", examId: "exam_1", sectionId: "sec_2", subjectId: "sub_science", date: "2026-09-24", startTime: "09:00", endTime: "10:30", room: "Room 12" },
  { id: "es_4", examId: "exam_2", sectionId: "sec_2", subjectId: "sub_math", date: "2026-12-08", startTime: "09:00", endTime: "10:30", room: null },
];
