export type FeeFrequency = "MONTHLY" | "ANNUAL" | "ONE_TIME";

// A template — "Grade 3 Tuition, Monthly, 5000" — not tied to any one
// student yet (see student-fees.ts for that step). campusId null means
// institute-wide (Office/Super Admin managed); non-null scopes it to one
// campus (that Campus Head's own territory), confirmed load-bearing in the
// real schema's own comment about Phase 11A campus scoping.
export interface FeeStructure {
  id: string;
  campusId: string | null;
  classId: string;
  feeCategoryId: string;
  name: string;
  amount: number;
  frequency: FeeFrequency;
  effectiveFrom: string;
  effectiveTo: string | null;
  archivedAt: string | null;
}

export const mockFeeStructures: FeeStructure[] = [
  { id: "fs_1", campusId: null, classId: "cls_3", feeCategoryId: "fc_tuition", name: "Grade 3 Tuition", amount: 5000, frequency: "MONTHLY", effectiveFrom: "2026-06-01", effectiveTo: null, archivedAt: null },
  { id: "fs_2", campusId: "cmp_main", classId: "cls_3", feeCategoryId: "fc_transport", name: "Grade 3 Transport — Main Campus", amount: 1500, frequency: "MONTHLY", effectiveFrom: "2026-06-01", effectiveTo: null, archivedAt: null },
  { id: "fs_3", campusId: null, classId: "cls_5", feeCategoryId: "fc_tuition", name: "Grade 5 Tuition", amount: 6000, frequency: "MONTHLY", effectiveFrom: "2026-06-01", effectiveTo: null, archivedAt: null },
  { id: "fs_4", campusId: null, classId: "cls_1", feeCategoryId: "fc_admission", name: "Grade 1 Admission Fee", amount: 10000, frequency: "ONE_TIME", effectiveFrom: "2026-06-01", effectiveTo: null, archivedAt: null },
  { id: "fs_5", campusId: null, classId: "cls_3", feeCategoryId: "fc_exam", name: "Grade 3 Examination Fee", amount: 2000, frequency: "ANNUAL", effectiveFrom: "2026-06-01", effectiveTo: null, archivedAt: null },
  { id: "fs_6", campusId: "cmp_north", classId: "cls_1", feeCategoryId: "fc_tuition", name: "Grade 1 Tuition — North Town", amount: 4500, frequency: "MONTHLY", effectiveFrom: "2025-06-01", effectiveTo: "2026-05-31", archivedAt: "2026-06-05T00:00:00" },
];
