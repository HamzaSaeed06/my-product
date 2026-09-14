import { mockTeachers } from "./teachers";

export type TeacherAttendanceStatus = "PRESENT" | "ABSENT" | "LEAVE";

export interface TeacherAttendanceRecord {
  id: string;
  teacherId: string;
  date: string;
  status: TeacherAttendanceStatus;
  markedById: string;
}

export const TODAY = "2026-09-14";

// Unique on [teacherId, date]. Correction here is a direct permission-gated
// PATCH (teacher_attendance.correct) — unlike student attendance there is
// no approval workflow, so the UI can just let an inline edit happen.
export const mockTeacherAttendance: TeacherAttendanceRecord[] = mockTeachers.map((t, i) => ({
  id: `tatt_${t.id}`,
  teacherId: t.id,
  date: TODAY,
  status: i === 1 ? "LEAVE" : "PRESENT",
  markedById: "usr_incharge_1",
}));
