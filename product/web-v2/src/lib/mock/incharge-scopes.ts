export interface InchargeScope {
  id: string;
  userId: string;
  campusId: string;
  academicYearId: string;
  classIds: string[];
  /** Empty means "all sections of the selected classes," not "no sections" — a deliberate API convention, not an edge case. */
  sectionIds: string[];
  version: number;
  revoked: boolean;
}

// One scope = one Incharge, one campus, one academic year, a set of
// classes (optionally narrowed to specific sections within them).
// Overlapping scopes across different Incharges are allowed by design.
export const mockInchargeScopes: InchargeScope[] = [
  { id: "scope_1", userId: "usr_incharge_1", campusId: "cmp_main", academicYearId: "ay_2026", classIds: ["cls_3"], sectionIds: [], version: 1, revoked: false },
  { id: "scope_2", userId: "usr_incharge_2", campusId: "cmp_main", academicYearId: "ay_2026", classIds: ["cls_5"], sectionIds: ["sec_4"], version: 2, revoked: false },
  { id: "scope_3", userId: "usr_incharge_3", campusId: "cmp_north", academicYearId: "ay_2026", classIds: ["cls_1", "cls_2"], sectionIds: [], version: 1, revoked: false },
  { id: "scope_4", userId: "usr_incharge_4", campusId: "cmp_riverside", academicYearId: "ay_2025", classIds: ["cls_4"], sectionIds: [], version: 1, revoked: true },
];
