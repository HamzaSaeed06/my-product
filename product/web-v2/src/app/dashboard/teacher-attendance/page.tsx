"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockTeachers } from "@/lib/mock/teachers";
import { mockAppUsers } from "@/lib/mock/app-users";
import { mockTeacherAttendance, TODAY, type TeacherAttendanceRecord, type TeacherAttendanceStatus } from "@/lib/mock/teacher-attendance";

const STATUS_LABEL: Record<TeacherAttendanceStatus, string> = { PRESENT: "Present", ABSENT: "Absent", LEAVE: "Leave" };

export default function TeacherAttendancePage() {
  const [date, setDate] = useState(TODAY);
  const [records, setRecords] = useState<TeacherAttendanceRecord[]>(mockTeacherAttendance);

  const activeTeachers = mockTeachers.filter((t) => t.status === "ACTIVE");

  function setStatus(teacherId: string, status: TeacherAttendanceStatus) {
    const existing = records.find((r) => r.teacherId === teacherId && r.date === date);
    if (existing) {
      setRecords((prev) => prev.map((r) => (r.id === existing.id ? { ...r, status } : r)));
      toast.success("Attendance corrected.");
    } else {
      setRecords((prev) => [...prev, { id: `tatt_${teacherId}_${date}`, teacherId, date, status, markedById: "usr_incharge_1" }]);
      toast.success("Attendance marked.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Teacher Attendance"
        description="No section concept here — one row per teacher per day. Unlike student attendance, a correction is a direct edit, not an approval request."
      />

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Date</span>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
      </div>

      <div className="surface-ring overflow-hidden rounded-[var(--card-radius)]">
        <div className="divide-y divide-border">
          {activeTeachers.map((teacher) => {
            const user = mockAppUsers.find((u) => u.id === teacher.userId);
            const record = records.find((r) => r.teacherId === teacher.id && r.date === date);
            return (
              <div key={teacher.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{user?.fullName ?? teacher.id}</span>
                  <span className="font-mono text-xs text-muted-foreground">{teacher.employeeCode}</span>
                </div>
                <Select value={record?.status ?? undefined} onValueChange={(v) => setStatus(teacher.id, v as TeacherAttendanceStatus)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Not marked">{(value) => STATUS_LABEL[value as TeacherAttendanceStatus]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(["PRESENT", "ABSENT", "LEAVE"] as TeacherAttendanceStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
