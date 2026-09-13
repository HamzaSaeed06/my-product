export interface CampusOverview {
  id: string;
  name: string;
  students: number;
  teachers: number;
  sections: number;
  pendingAdmissions: number;
  feeCollectedPct: number;
  attendanceTodayPct: number;
}

export const mockCampuses: CampusOverview[] = [
  { id: "cmp_main", name: "Main Campus", students: 1284, teachers: 62, sections: 38, pendingAdmissions: 14, feeCollectedPct: 91, attendanceTodayPct: 94 },
  { id: "cmp_north", name: "North Town Campus", students: 742, teachers: 34, sections: 22, pendingAdmissions: 6, feeCollectedPct: 87, attendanceTodayPct: 91 },
  { id: "cmp_riverside", name: "Riverside Campus", students: 519, teachers: 27, sections: 17, pendingAdmissions: 21, feeCollectedPct: 78, attendanceTodayPct: 89 },
  { id: "cmp_hilltop", name: "Hilltop Campus", students: 366, teachers: 19, sections: 12, pendingAdmissions: 3, feeCollectedPct: 95, attendanceTodayPct: 96 },
];

export const mockTotals = {
  campuses: mockCampuses.length,
  students: mockCampuses.reduce((sum, c) => sum + c.students, 0),
  studentsDeltaPct: 4.2,
  teachers: mockCampuses.reduce((sum, c) => sum + c.teachers, 0),
  teachersDeltaPct: 1.8,
  pendingAdmissions: mockCampuses.reduce((sum, c) => sum + c.pendingAdmissions, 0),
};

export interface EnrollmentPoint {
  date: string;
  main: number;
  north: number;
  riverside: number;
  hilltop: number;
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// 90 days of genuinely noisy daily data, ending at each campus's current
// headcount from mockCampuses above. The first version of this generator
// added noise sized off the tiny daily growth increment (~1 student) —
// invisible against a stacked total in the thousands, so the chart still
// plotted as a near-straight line no matter the curve type. Noise here is
// sized as a real fraction of the headcount itself (~3.5%, day to day —
// same-day attendance-office corrections, batch admission processing on
// some days and not others) so it's actually visible at chart scale, the
// way the shadcn reference chart's own (highly variable, independent-per-
// day) data is.
function generateDailySeries(endValue: number, days: number, seed: number): number[] {
  const rand = seededRandom(seed);
  const startValue = endValue * 0.93;
  const amplitude = endValue * 0.035;
  const values: number[] = [];
  for (let i = 0; i < days; i++) {
    const trend = startValue + ((endValue - startValue) * i) / (days - 1);
    const noise = (rand() - 0.5) * 2 * amplitude;
    values.push(Math.round(trend + noise));
  }
  // Anchor the last point exactly to the campus's known current headcount.
  values[values.length - 1] = endValue;
  return values;
}

const DAYS = 90;
const today = new Date("2026-09-13");
const dates = Array.from({ length: DAYS }, (_, i) => {
  const d = new Date(today);
  d.setDate(d.getDate() - (DAYS - 1 - i));
  return d.toISOString().slice(0, 10);
});

const mainSeries = generateDailySeries(1284, DAYS, 11);
const northSeries = generateDailySeries(742, DAYS, 23);
const riversideSeries = generateDailySeries(519, DAYS, 37);
const hilltopSeries = generateDailySeries(366, DAYS, 51);

export const mockEnrollmentTrend: EnrollmentPoint[] = dates.map((date, i) => ({
  date,
  main: mainSeries[i],
  north: northSeries[i],
  riverside: riversideSeries[i],
  hilltop: hilltopSeries[i],
}));
