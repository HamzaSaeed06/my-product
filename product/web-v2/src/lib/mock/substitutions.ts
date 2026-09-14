export interface Substitution {
  id: string;
  timetableEntryId: string;
  date: string;
  originalTeacherId: string;
  substituteTeacherId: string;
  reason: string | null;
  createdById: string;
  cancelledAt: string | null;
}

// Unique on [timetableEntryId, date] — one substitute per class-period per
// day. "Cancel" not delete, per the platform's no-hard-delete policy.
export const mockSubstitutions: Substitution[] = [
  { id: "sub_1", timetableEntryId: "tt_1_e3", date: "2026-09-14", originalTeacherId: "tch_1", substituteTeacherId: "tch_3", reason: "Medical leave", createdById: "usr_incharge_1", cancelledAt: null },
  { id: "sub_2", timetableEntryId: "tt_1_e9", date: "2026-09-15", originalTeacherId: "tch_2", substituteTeacherId: "tch_1", reason: "Attending a training workshop", createdById: "usr_incharge_1", cancelledAt: null },
  { id: "sub_3", timetableEntryId: "tt_1_e14", date: "2026-09-10", originalTeacherId: "tch_1", substituteTeacherId: "tch_2", reason: "Personal leave", createdById: "usr_incharge_1", cancelledAt: "2026-09-09T16:00:00" },
];
