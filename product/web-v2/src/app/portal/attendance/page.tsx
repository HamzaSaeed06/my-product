"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusDot, type StatusTone } from "@/components/status-dot";
import { getStudentById } from "@/lib/mock/students";
import { getSectionRoster, getSectionForStudent } from "@/lib/mock/sections";
import { mockAttendance, TODAY, type AttendanceStatus } from "@/lib/mock/attendance";
import { PORTAL_DEMO } from "@/lib/mock/portal-session";
import { usePortal } from "../portal-context";

const STATUS_TONE: Record<AttendanceStatus, StatusTone> = { PRESENT: "success", ABSENT: "danger", LEAVE: "warning" };
const STATUS_LABEL: Record<AttendanceStatus, string> = { PRESENT: "Present", ABSENT: "Absent", LEAVE: "Leave" };

function TeacherAttendance() {
  const [date, setDate] = useState(TODAY);
  const roster = getSectionRoster(PORTAL_DEMO.teacherSectionId);
  const existing = mockAttendance.filter((a) => a.sectionId === PORTAL_DEMO.teacherSectionId && a.date === date);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>(() => Object.fromEntries(roster.map((s) => [s.id, "PRESENT" as AttendanceStatus])));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Date</span>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
      </div>
      <div className="surface-ring flex flex-col divide-y divide-border overflow-hidden rounded-[var(--card-radius)]">
        {roster.map((student) => {
          const record = existing.find((r) => r.studentId === student.id);
          return (
            <div key={student.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span className="text-sm font-medium text-foreground">{student.fullName}</span>
              {record ? (
                <StatusDot tone={STATUS_TONE[record.status]}>{STATUS_LABEL[record.status]}</StatusDot>
              ) : (
                <Select value={statuses[student.id]} onValueChange={(v) => setStatuses((prev) => ({ ...prev, [student.id]: v as AttendanceStatus }))}>
                  <SelectTrigger className="w-32">
                    <SelectValue>{(v) => STATUS_LABEL[v as AttendanceStatus]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(["PRESENT", "ABSENT", "LEAVE"] as AttendanceStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          );
        })}
      </div>
      {existing.length === 0 && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => toast.success(`Attendance submitted for ${roster.length} students.`)}>
            Submit attendance
          </Button>
        </div>
      )}
    </div>
  );
}

function FamilyAttendance({ studentId }: { studentId: string }) {
  const records = mockAttendance.filter((a) => a.studentId === studentId).sort((a, b) => b.date.localeCompare(a.date));
  const pct = records.length ? Math.round((records.filter((r) => r.status === "PRESENT").length / records.length) * 100) : null;

  return (
    <div className="flex flex-col gap-4">
      {pct !== null && (
        <div className="surface-ring flex items-center justify-between rounded-[var(--card-radius)] p-4">
          <span className="text-sm text-foreground">Overall attendance</span>
          <span className="font-mono text-xl font-semibold text-foreground">{pct}%</span>
        </div>
      )}
      <div className="surface-ring flex flex-col divide-y divide-border overflow-hidden rounded-[var(--card-radius)]">
        {records.length === 0 ? (
          <p className="px-4 py-3 text-sm text-muted-foreground">No attendance records yet.</p>
        ) : (
          records.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-4 py-2.5">
              <span className="font-mono text-sm text-foreground">{r.date}</span>
              <StatusDot tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</StatusDot>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function PortalAttendancePage() {
  const { role, activeChildId } = usePortal();
  const student = role !== "TEACHER" ? getStudentById(activeChildId) : null;
  const section = role !== "TEACHER" ? getSectionForStudent(activeChildId) : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Attendance"
        description={role === "TEACHER" ? "Mark today's attendance for your section." : `${student?.fullName}'s attendance history${section ? ` — ${section.name}` : ""}.`}
      />
      {role === "TEACHER" ? <TeacherAttendance /> : <FamilyAttendance studentId={activeChildId} />}
    </div>
  );
}
