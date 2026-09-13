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

// 90 days of genuinely noisy daily data (new admissions land unevenly day
// to day — Mondays and month-starts run heavier, weekends lighter), ending
// at each campus's current headcount from mockCampuses above. A smooth
// month-over-month average would plot as a near-straight line no matter
// the chart type; the day-to-day variance is what makes a trend line worth
// looking at, and it's what the shadcn reference chart's own data has.
function generateDailySeries(endValue: number, days: number, seed: number): number[] {
  const rand = seededRandom(seed);
  const monthlyGrowth = endValue * 0.018;
  const dailyGrowth = monthlyGrowth / 30;
  const values: number[] = [];
  let value = endValue - dailyGrowth * days;
  for (let i = 0; i < days; i++) {
    value += dailyGrowth + (rand() - 0.5) * dailyGrowth * 6;
    values.push(Math.round(value));
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
