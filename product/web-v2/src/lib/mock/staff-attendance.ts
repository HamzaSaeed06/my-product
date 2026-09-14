export type CheckInMethod = "QR" | "MANUAL" | "REMOTE_APPROVED";
export type VerifiedStatus = "VERIFIED" | "UNVERIFIED" | "MANUAL_OVERRIDE";

// Distinct from Teacher Attendance by design (confirmed via the real
// schema's own comment) — this is a WHEN/HOW check-in-verification record
// keyed by User (covers Campus Head/Incharge/Office too, not just
// Teachers), not a present/absent/leave attendance mark.
export interface StaffAttendanceRecord {
  id: string;
  userId: string;
  campusId: string;
  date: string;
  checkInAt: string | null;
  checkInMethod: CheckInMethod | null;
  verifiedStatus: VerifiedStatus;
  ipAddress: string | null;
  geoLat: number | null;
  geoLng: number | null;
  markedById: string | null;
}

export const TODAY = "2026-09-14";

// Unique on [userId, date]. INCHARGE is documented as campus-unscoped here
// (no campus-based UserRole) — a known real-backend gap, not something to
// "fix" in this mock data.
export const mockStaffAttendance: StaffAttendanceRecord[] = [
  { id: "sa_1", userId: "usr_teacher_1", campusId: "cmp_main", date: TODAY, checkInAt: "2026-09-14T07:52:00", checkInMethod: "QR", verifiedStatus: "VERIFIED", ipAddress: "10.0.4.12", geoLat: 31.5204, geoLng: 74.3587, markedById: null },
  { id: "sa_2", userId: "usr_teacher_2", campusId: "cmp_main", date: TODAY, checkInAt: "2026-09-14T07:58:00", checkInMethod: "QR", verifiedStatus: "VERIFIED", ipAddress: "10.0.4.19", geoLat: 31.5205, geoLng: 74.3589, markedById: null },
  { id: "sa_3", userId: "usr_office_1", campusId: "cmp_main", date: TODAY, checkInAt: "2026-09-14T08:10:00", checkInMethod: "MANUAL", verifiedStatus: "MANUAL_OVERRIDE", ipAddress: null, geoLat: null, geoLng: null, markedById: "usr_incharge_1" },
  { id: "sa_4", userId: "usr_incharge_1", campusId: "cmp_main", date: TODAY, checkInAt: "2026-09-14T07:45:00", checkInMethod: "REMOTE_APPROVED", verifiedStatus: "VERIFIED", ipAddress: "182.191.34.2", geoLat: null, geoLng: null, markedById: "usr_head_main" },
  { id: "sa_5", userId: "usr_teacher_3", campusId: "cmp_north", date: TODAY, checkInAt: "2026-09-14T08:34:00", checkInMethod: "QR", verifiedStatus: "UNVERIFIED", ipAddress: "10.0.9.4", geoLat: 31.55, geoLng: 74.35, markedById: null },
  // Not checked in yet today — no row at all until they do, this is what
  // "who hasn't checked in" looks like against the campus roster.
];
