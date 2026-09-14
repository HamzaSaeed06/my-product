import { getSectionRoster } from "./sections";

// The assignment step — attaches one FeeStructure template to one student,
// optionally overriding its amount. Unique on [studentId, feeStructureId]
// in the real backend — one assignment of a given structure per student.
export interface StudentFee {
  id: string;
  studentId: string;
  feeStructureId: string;
  overrideAmount: number | null;
  effectiveFrom: string;
  archivedAt: string | null;
}

// sec_2 (real students, same section used across every batch since it's
// the one with an actual roster) — every student gets Tuition + Transport,
// one has a scholarship-style override on Tuition.
const sec2Roster = getSectionRoster("sec_2");

export const mockStudentFees: StudentFee[] = sec2Roster.flatMap((s, i) => [
  { id: `sf_${s.id}_tuition`, studentId: s.id, feeStructureId: "fs_1", overrideAmount: i === 0 ? 3000 : null, effectiveFrom: "2026-06-01", archivedAt: null },
  { id: `sf_${s.id}_transport`, studentId: s.id, feeStructureId: "fs_2", overrideAmount: null, effectiveFrom: "2026-06-01", archivedAt: null },
]);
