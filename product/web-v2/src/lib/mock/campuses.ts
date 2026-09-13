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
  month: string;
  main: number;
  north: number;
  riverside: number;
  hilltop: number;
}

export const mockEnrollmentTrend: EnrollmentPoint[] = [
  { month: "Apr", main: 1190, north: 690, riverside: 470, hilltop: 340 },
  { month: "May", main: 1205, north: 701, riverside: 480, hilltop: 345 },
  { month: "Jun", main: 1220, north: 712, riverside: 489, hilltop: 350 },
  { month: "Jul", main: 1238, north: 720, riverside: 498, hilltop: 355 },
  { month: "Aug", main: 1261, north: 731, riverside: 507, hilltop: 360 },
  { month: "Sep", main: 1284, north: 742, riverside: 519, hilltop: 366 },
];
