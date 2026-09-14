"use client";

import { PageHeader } from "@/components/page-header";
import { getStudentById } from "@/lib/mock/students";
import { getSectionForStudent } from "@/lib/mock/sections";
import { mockSubjects } from "@/lib/mock/subjects";
import { mockTeachers } from "@/lib/mock/teachers";
import { mockAppUsers } from "@/lib/mock/app-users";
import { mockTimetables, mockTimetableEntries, DAYS, DAY_LABELS, PERIODS } from "@/lib/mock/timetable";
import { PORTAL_DEMO } from "@/lib/mock/portal-session";
import { usePortal } from "../portal-context";

export default function PortalTimetablePage() {
  const { role, activeChildId } = usePortal();
  const sectionId = role === "TEACHER" ? PORTAL_DEMO.teacherSectionId : getSectionForStudent(activeChildId)?.id;
  const student = role !== "TEACHER" ? getStudentById(activeChildId) : null;
  const timetable = mockTimetables.find((t) => t.sectionId === sectionId);
  const entries = timetable ? mockTimetableEntries.filter((e) => e.timetableId === timetable.id) : [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Timetable"
        description={role === "TEACHER" ? "Your primary section's weekly schedule." : `${student?.fullName}'s weekly schedule.`}
      />
      {!timetable || timetable.status !== "PUBLISHED" ? (
        <p className="text-sm text-muted-foreground">No published timetable yet for this section.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {DAYS.map((day) => {
            const dayEntries = entries.filter((e) => e.dayOfWeek === day).sort((a, b) => a.periodNumber - b.periodNumber);
            if (dayEntries.length === 0) return null;
            return (
              <div key={day} className="flex flex-col gap-2">
                <span className="label-eyebrow text-muted-foreground">{DAY_LABELS[day]}</span>
                <div className="surface-ring flex flex-col divide-y divide-border overflow-hidden rounded-[var(--card-radius)]">
                  {PERIODS.map((period) => {
                    const entry = dayEntries.find((e) => e.periodNumber === period);
                    if (!entry) return null;
                    const subject = mockSubjects.find((s) => s.id === entry.subjectId)?.name;
                    const teacher = mockTeachers.find((t) => t.id === entry.teacherId);
                    const teacherName = teacher ? mockAppUsers.find((u) => u.id === teacher.userId)?.fullName : "";
                    return (
                      <div key={period} className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-sm text-foreground">{subject}</span>
                        <span className="text-xs text-muted-foreground">
                          Period {period} · {teacherName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
