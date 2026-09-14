"use client";

import { PageHeader } from "@/components/page-header";
import { StatStrip } from "@/components/stat-tile";
import { ExportButton } from "@/components/export-button";
import { mockTeachers } from "@/lib/mock/teachers";
import { mockAppUsers } from "@/lib/mock/app-users";
import { mockTeacherAttendance, TODAY } from "@/lib/mock/teacher-attendance";
import { mockLeaves } from "@/lib/mock/leaves";

export default function StaffReportPage() {
  const activeTeachers = mockTeachers.filter((t) => t.status === "ACTIVE");
  const presentToday = mockTeacherAttendance.filter((a) => a.date === TODAY && a.status === "PRESENT").length;
  const approvedLeaves = mockLeaves.filter((l) => l.subjectType === "TEACHER" && l.status === "APPROVED").length;
  const pendingLeaves = mockLeaves.filter((l) => l.subjectType === "TEACHER" && l.status === "PENDING").length;

  const rows = activeTeachers.map((teacher) => {
    const attendance = mockTeacherAttendance.find((a) => a.teacherId === teacher.id && a.date === TODAY);
    const leaveCount = mockLeaves.filter((l) => l.teacherId === teacher.id && l.status === "APPROVED").length;
    return {
      name: mockAppUsers.find((u) => u.id === teacher.userId)?.fullName ?? teacher.id,
      attendance: attendance?.status ?? "Not marked",
      leaveCount,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Staff Report"
        description="Teacher attendance and leave patterns — computed live from Teacher Attendance and Leaves."
        actions={<ExportButton filename="staff-report.csv" rows={[["Teacher", "Today", "Approved leaves"], ...rows.map((r) => [r.name, r.attendance, r.leaveCount])]} />}
      />
      <StatStrip
        entries={[
          { label: "Active teachers", value: activeTeachers.length },
          { label: "Present today", value: presentToday },
          { label: "Approved leaves", value: approvedLeaves },
          { label: "Pending leave requests", value: pendingLeaves },
        ]}
      />
      <div className="surface-ring overflow-hidden rounded-[var(--card-radius)]">
        <div className="divide-y divide-border">
          {rows.map((r) => (
            <div key={r.name} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm text-foreground">{r.name}</span>
              <span className="text-sm text-muted-foreground">{r.attendance} today · {r.leaveCount} approved leaves</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
