import { getSectionRoster } from "./sections";
import { mockExamSchedules } from "./exams";

// Strict, sequential, one-way except via a locked-record correction
// (confirmed: atomic conditional update in the real service, race-safe
// against double-approval). Items are editable only while DRAFT.
export type ResultStatus = "DRAFT" | "SUBMITTED" | "REVIEWED" | "FINALIZED" | "PUBLISHED";

export const RESULT_STAGE_ORDER: ResultStatus[] = ["DRAFT", "SUBMITTED", "REVIEWED", "FINALIZED", "PUBLISHED"];

// One row per student per exam — unique on [studentId, examId].
export interface Result {
  id: string;
  studentId: string;
  examId: string;
  sectionId: string;
  status: ResultStatus;
}

// Per-subject marks — unique on [resultId, subjectId]. Subjects here come
// straight from that exam's scheduled papers for the section, not a
// separately-maintained subject list.
export interface ResultItem {
  id: string;
  resultId: string;
  subjectId: string;
  marksObtained: number | null;
  maxMarks: number;
}

const sec2Roster = getSectionRoster("sec_2");
const exam1SubjectIds = mockExamSchedules.filter((s) => s.examId === "exam_1" && s.sectionId === "sec_2").map((s) => s.subjectId);

// One student at each stage of the pipeline at once, deliberately — the
// clearest way to demo every stage's UI in one screen instead of five
// nearly-identical seed states.
const STAGE_SEQUENCE: ResultStatus[] = ["DRAFT", "SUBMITTED", "REVIEWED", "FINALIZED", "PUBLISHED"];

export const mockResults: Result[] = sec2Roster.map((s, i) => ({
  id: `res_${s.id}`,
  studentId: s.id,
  examId: "exam_1",
  sectionId: "sec_2",
  status: STAGE_SEQUENCE[i % STAGE_SEQUENCE.length],
}));

export const mockResultItems: ResultItem[] = mockResults.flatMap((result, i) =>
  exam1SubjectIds.map((subjectId, j) => ({
    id: `ri_${result.id}_${subjectId}`,
    resultId: result.id,
    subjectId,
    // The DRAFT student's marks haven't been entered yet — everyone else
    // already has marks from before this workflow was even started.
    marksObtained: result.status === "DRAFT" ? null : 60 + ((i * 7 + j * 5) % 35),
    maxMarks: 100,
  })),
);
