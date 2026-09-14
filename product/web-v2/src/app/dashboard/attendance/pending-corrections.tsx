"use client";

import { Button } from "@/components/ui/button";
import { getStudentById } from "@/lib/mock/students";
import type { AttendanceCorrectionRequest, AttendanceRecord } from "@/lib/mock/attendance";

export function PendingCorrections({
  corrections,
  records,
  onDecide,
}: {
  corrections: AttendanceCorrectionRequest[];
  records: AttendanceRecord[];
  onDecide: (correctionId: string, approve: boolean) => void;
}) {
  if (corrections.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <span className="label-eyebrow text-muted-foreground">Pending corrections</span>
      <div className="surface-ring flex flex-col divide-y divide-border overflow-hidden rounded-[var(--card-radius)]">
        {corrections.map((correction) => {
          const record = records.find((r) => r.id === correction.attendanceId);
          const student = record ? getStudentById(record.studentId) : null;
          return (
            <div key={correction.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm text-foreground">
                  <strong className="font-medium">{student?.fullName ?? "Unknown student"}</strong> → {correction.requestedStatus.charAt(0) + correction.requestedStatus.slice(1).toLowerCase()}
                </span>
                <span className="text-xs text-muted-foreground">{correction.reason}</span>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" size="sm" onClick={() => onDecide(correction.id, false)}>
                  Reject
                </Button>
                <Button size="sm" onClick={() => onDecide(correction.id, true)}>
                  Approve
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
