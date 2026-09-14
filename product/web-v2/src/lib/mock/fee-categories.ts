// No dedicated permission namespace or page in the real backend — managed
// inline from the Fee Structures page and gated by fee_structure.* itself,
// confirmed from routes.ts. Simplest entity here: unique on name, archive
// only (no hard delete).
export interface FeeCategory {
  id: string;
  name: string;
  archivedAt: string | null;
}

export const mockFeeCategories: FeeCategory[] = [
  { id: "fc_tuition", name: "Tuition", archivedAt: null },
  { id: "fc_transport", name: "Transport", archivedAt: null },
  { id: "fc_admission", name: "Admission Fee", archivedAt: null },
  { id: "fc_exam", name: "Examination Fee", archivedAt: null },
  { id: "fc_uniform", name: "Uniform", archivedAt: null },
  { id: "fc_activity", name: "Activity Fee", archivedAt: "2025-06-01T00:00:00" },
];
