export type TimetableStatus = "DRAFT" | "PUBLISHED";
export type DayOfWeek = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT";

export interface Timetable {
  id: string;
  sectionId: string;
  academicYearId: string;
  status: TimetableStatus;
  publishedAt: string | null;
}

export interface TimetableEntry {
  id: string;
  timetableId: string;
  dayOfWeek: DayOfWeek;
  periodNumber: number;
  subjectId: string;
  teacherId: string;
}

export const DAYS: DayOfWeek[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
export const DAY_LABELS: Record<DayOfWeek, string> = {
  MON: "Mon", TUE: "Tue", WED: "Wed", THU: "Thu", FRI: "Fri", SAT: "Sat",
};
export const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

// One timetable per [sectionId, academicYearId] — the real backend's own
// uniqueness constraint. sec_1 is published (the common case); sec_4 is
// still a draft with gaps, to demonstrate the empty-cell "add entry" state.
export const mockTimetables: Timetable[] = [
  { id: "tt_1", sectionId: "sec_1", academicYearId: "ay_2026", status: "PUBLISHED", publishedAt: "2026-08-20T09:00:00" },
  { id: "tt_2", sectionId: "sec_4", academicYearId: "ay_2026", status: "DRAFT", publishedAt: null },
];

const SUBJECT_TEACHER: [string, string][] = [
  ["sub_math", "tch_1"],
  ["sub_english", "tch_3"],
  ["sub_science", "tch_2"],
  ["sub_urdu", "tch_3"],
  ["sub_islamiat", "tch_1"],
  ["sub_computer", "tch_2"],
];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// Conflict checking (no teacher double-booked across two sections at the
// same day+period, no class double-booked) is service-layer only in the
// real backend, not a DB constraint — this generator doesn't need to
// enforce it for mock data, but keeps it plausible by rotating pairs.
function buildEntries(timetableId: string, filledRatio: number, seed: number): TimetableEntry[] {
  const rand = seededRandom(seed);
  const entries: TimetableEntry[] = [];
  let n = 0;
  for (const day of DAYS) {
    for (const period of PERIODS) {
      if (rand() < filledRatio) {
        const [subjectId, teacherId] = SUBJECT_TEACHER[Math.floor(rand() * SUBJECT_TEACHER.length)];
        n++;
        entries.push({ id: `${timetableId}_e${n}`, timetableId, dayOfWeek: day, periodNumber: period, subjectId, teacherId });
      }
    }
  }
  return entries;
}

export const mockTimetableEntries: TimetableEntry[] = [
  ...buildEntries("tt_1", 0.92, 5),
  ...buildEntries("tt_2", 0.45, 9),
];
