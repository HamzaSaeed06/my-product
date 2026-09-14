import { getSectionRoster } from "./sections";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LEAVE";
export type CorrectionStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface AttendanceRecord {
  id: string;
  studentId: string;
  sectionId: string;
  date: string;
  status: AttendanceStatus;
  markedById: string;
}

// Real backend: unique on [studentId, date] — one record per student per
// calendar day, regardless of section. Deliberately NOT [sectionId, date]:
// a student changing sections mid-year doesn't get a second row for a day
// already marked.
export interface AttendanceCorrectionRequest {
  id: string;
  attendanceId: string;
  requestedStatus: AttendanceStatus;
  reason: string;
  status: CorrectionStatus;
  requestedById: string;
  requestedAt: string;
  decidedById: string | null;
  decidedAt: string | null;
}

export const TODAY = "2026-09-14";

// sec_2's roster is already submitted for today, with one flagged absence —
// demonstrates the read-only table + pending-correction state.
const sec2Roster = getSectionRoster("sec_2");
export const mockAttendance: AttendanceRecord[] = sec2Roster.map((s, i) => ({
  id: `att_${s.id}`,
  studentId: s.id,
  sectionId: "sec_2",
  date: TODAY,
  status: i === 1 ? "ABSENT" : "PRESENT",
  markedById: "usr_teacher_1",
}));

// sec_4 has no records yet for today at all — this is the empty-roster
// state that renders the bulk mark-attendance form instead of a table.

export const mockAttendanceCorrections: AttendanceCorrectionRequest[] = [
  {
    id: "atc_1",
    attendanceId: mockAttendance[1]?.id ?? "",
    requestedStatus: "PRESENT",
    reason: "Marked absent by mistake — she was at the morning assembly, just late into homeroom.",
    status: "PENDING",
    requestedById: "usr_teacher_1",
    requestedAt: "2026-09-14T10:15:00",
    decidedById: null,
    decidedAt: null,
  },
];
