export type AcademicYearStatus = "ACTIVE" | "CLOSED";

export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: AcademicYearStatus;
}

// Sessions can overlap by design (a closing year and a starting year both
// have live sections during the handover window) — the two most recent
// entries here deliberately overlap by a month to keep that visible.
export const mockAcademicYears: AcademicYear[] = [
  { id: "ay_2024", name: "2024-25", startDate: "2024-08-01", endDate: "2025-06-30", status: "CLOSED" },
  { id: "ay_2025", name: "2025-26", startDate: "2025-06-01", endDate: "2026-06-30", status: "CLOSED" },
  { id: "ay_2026", name: "2026-27", startDate: "2026-06-01", endDate: "2027-06-30", status: "ACTIVE" },
];
