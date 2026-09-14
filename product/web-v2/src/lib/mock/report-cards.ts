import { mockResults, mockResultItems } from "./results";

export interface ReportCardSnapshotItem {
  subjectId: string;
  marksObtained: number | null;
  maxMarks: number;
}

// A JSON snapshot taken at generation time — not live-computed from
// Results, confirmed in the real backend. Regenerating overwrites the same
// row (unique on resultId, no version history). Only generatable once the
// underlying Result is FINALIZED or PUBLISHED.
export interface ReportCard {
  id: string;
  resultId: string;
  studentId: string;
  examId: string;
  generatedAt: string;
  snapshot: ReportCardSnapshotItem[];
  totalObtained: number;
  totalMax: number;
}

// Seeded only for the results already FINALIZED/PUBLISHED in results.ts —
// everyone else has no report card yet since their Result isn't locked.
export const mockReportCards: ReportCard[] = mockResults
  .filter((r) => r.status === "FINALIZED" || r.status === "PUBLISHED")
  .map((result) => {
    const items = mockResultItems.filter((i) => i.resultId === result.id);
    const snapshot: ReportCardSnapshotItem[] = items.map((i) => ({ subjectId: i.subjectId, marksObtained: i.marksObtained, maxMarks: i.maxMarks }));
    return {
      id: `rc_${result.id}`,
      resultId: result.id,
      studentId: result.studentId,
      examId: result.examId,
      generatedAt: "2026-09-13T16:00:00",
      snapshot,
      totalObtained: snapshot.reduce((sum, s) => sum + (s.marksObtained ?? 0), 0),
      totalMax: snapshot.reduce((sum, s) => sum + s.maxMarks, 0),
    };
  });
