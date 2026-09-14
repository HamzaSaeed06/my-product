"use client";

import { PageHeader } from "@/components/page-header";
import { StatStrip } from "@/components/stat-tile";
import { ExportButton } from "@/components/export-button";
import { mockAttendance } from "@/lib/mock/attendance";
import { mockSections } from "@/lib/mock/sections";
import { mockClasses } from "@/lib/mock/classes";

export default function AttendanceReportPage() {
  const total = mockAttendance.length;
  const present = mockAttendance.filter((a) => a.status === "PRESENT").length;
  const absent = mockAttendance.filter((a) => a.status === "ABSENT").length;
  const leave = mockAttendance.filter((a) => a.status === "LEAVE").length;
  const attendancePct = total ? (present / total) * 100 : 0;

  const bySection = Array.from(new Set(mockAttendance.map((a) => a.sectionId))).map((sectionId) => {
    const records = mockAttendance.filter((a) => a.sectionId === sectionId);
    const pct = (records.filter((r) => r.status === "PRESENT").length / records.length) * 100;
    return { sectionId, pct, total: records.length };
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Attendance Report"
        description="Student attendance rates by section — computed live from Attendance records."
        actions={
          <ExportButton
            filename="attendance-report.csv"
            rows={[["Section", "Attendance %", "Records"], ...bySection.map((s) => [sectionLabel(s.sectionId), s.pct.toFixed(1), s.total])]}
          />
        }
      />
      <StatStrip
        entries={[
          { label: "Overall attendance", value: `${attendancePct.toFixed(1)}%` },
          { label: "Present", value: present },
          { label: "Absent", value: absent },
          { label: "On leave", value: leave },
        ]}
      />
      <div className="surface-ring overflow-hidden rounded-[var(--card-radius)]">
        <div className="divide-y divide-border">
          {bySection.map((s) => (
            <div key={s.sectionId} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm text-foreground">{sectionLabel(s.sectionId)}</span>
              <span className="font-mono text-sm text-muted-foreground">{s.pct.toFixed(1)}% · {s.total} records</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function sectionLabel(sectionId: string) {
  const section = mockSections.find((s) => s.id === sectionId);
  const className = section ? mockClasses.find((c) => c.id === section.classId)?.name : "";
  return section ? `${className} ${section.name}` : sectionId;
}
