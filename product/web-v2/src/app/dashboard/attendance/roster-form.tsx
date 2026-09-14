"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Student } from "@/lib/mock/students";
import type { AttendanceStatus } from "@/lib/mock/attendance";

const STATUS_OPTIONS: AttendanceStatus[] = ["PRESENT", "ABSENT", "LEAVE"];
const STATUS_LABEL: Record<AttendanceStatus, string> = { PRESENT: "Present", ABSENT: "Absent", LEAVE: "Leave" };

// No records exist yet for this section+date — the real backend has
// nothing to show, so this renders the whole roster as one bulk form
// (default Present per student) with a single submit, rather than N
// separate per-row saves.
export function AttendanceRosterForm({
  roster,
  onSubmit,
}: {
  roster: Student[];
  onSubmit: (statuses: Record<string, AttendanceStatus>) => void;
}) {
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>(
    () => Object.fromEntries(roster.map((s) => [s.id, "PRESENT" as AttendanceStatus])),
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="surface-ring overflow-hidden rounded-[var(--card-radius)]">
        <div className="divide-y divide-border">
          {roster.map((student) => (
            <div key={student.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{student.fullName}</span>
                <span className="font-mono text-xs text-muted-foreground">{student.admissionNo}</span>
              </div>
              <Select value={statuses[student.id]} onValueChange={(v) => setStatuses((prev) => ({ ...prev, [student.id]: v as AttendanceStatus }))}>
                <SelectTrigger className="w-32">
                  <SelectValue>{(value) => STATUS_LABEL[value as AttendanceStatus]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end">
        <Button size="sm" onClick={() => onSubmit(statuses)}>
          Submit attendance
        </Button>
      </div>
    </div>
  );
}
