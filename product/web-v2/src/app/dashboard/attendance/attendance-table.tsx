"use client";

import { Button } from "@/components/ui/button";
import { StatusDot, type StatusTone } from "@/components/status-dot";
import { getStudentById } from "@/lib/mock/students";
import type { AttendanceRecord, AttendanceStatus } from "@/lib/mock/attendance";

const STATUS_TONE: Record<AttendanceStatus, StatusTone> = { PRESENT: "success", ABSENT: "danger", LEAVE: "warning" };
const STATUS_LABEL: Record<AttendanceStatus, string> = { PRESENT: "Present", ABSENT: "Absent", LEAVE: "Leave" };

// Already submitted for this section+date — read-only. A row isn't edited
// directly; "Request correction" starts an approval workflow instead
// (attendance.correct decides it), unlike Teacher Attendance below which
// allows a direct edit.
export function AttendanceTable({
  records,
  hasPendingCorrection,
  onRequestCorrection,
}: {
  records: AttendanceRecord[];
  hasPendingCorrection: (attendanceId: string) => boolean;
  onRequestCorrection: (record: AttendanceRecord) => void;
}) {
  return (
    <div className="surface-ring overflow-hidden rounded-[var(--card-radius)]">
      <div className="divide-y divide-border">
        {records.map((record) => {
          const student = getStudentById(record.studentId);
          const pending = hasPendingCorrection(record.id);
          return (
            <div key={record.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{student?.fullName ?? record.studentId}</span>
                <span className="font-mono text-xs text-muted-foreground">{student?.admissionNo}</span>
              </div>
              <div className="flex items-center gap-3">
                <StatusDot tone={STATUS_TONE[record.status]}>{STATUS_LABEL[record.status]}</StatusDot>
                <Button variant="ghost" size="sm" disabled={pending} onClick={() => onRequestCorrection(record)}>
                  {pending ? "Correction pending" : "Request correction"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
