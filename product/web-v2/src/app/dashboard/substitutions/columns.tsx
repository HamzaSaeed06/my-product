"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { StatusDot } from "@/components/status-dot";
import { mockTimetableEntries, mockTimetables, DAY_LABELS } from "@/lib/mock/timetable";
import { mockSections } from "@/lib/mock/sections";
import { mockClasses } from "@/lib/mock/classes";
import { mockSubjects } from "@/lib/mock/subjects";
import { mockTeachers } from "@/lib/mock/teachers";
import { mockAppUsers } from "@/lib/mock/app-users";
import type { Substitution } from "@/lib/mock/substitutions";
import { SubstitutionRowActions } from "./row-actions";

function teacherName(teacherId: string) {
  const teacher = mockTeachers.find((t) => t.id === teacherId);
  return teacher ? mockAppUsers.find((u) => u.id === teacher.userId)?.fullName ?? teacherId : teacherId;
}

export function describeEntry(timetableEntryId: string) {
  const entry = mockTimetableEntries.find((e) => e.id === timetableEntryId);
  if (!entry) return { classSection: "—", slot: "—" };
  const timetable = mockTimetables.find((t) => t.id === entry.timetableId);
  const section = timetable ? mockSections.find((s) => s.id === timetable.sectionId) : null;
  const className = section ? mockClasses.find((c) => c.id === section.classId)?.name : "";
  const subject = mockSubjects.find((s) => s.id === entry.subjectId)?.name;
  return {
    classSection: section ? `${className} ${section.name}` : "—",
    slot: `${DAY_LABELS[entry.dayOfWeek]} · P${entry.periodNumber} · ${subject}`,
  };
}

export const substitutionColumns: ColumnDef<Substitution>[] = [
  {
    accessorKey: "date",
    header: "Date",
    meta: { label: "Date" },
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.date}</span>,
  },
  {
    id: "class",
    header: "Class / Period",
    meta: { label: "Class / Period" },
    cell: ({ row }) => {
      const { classSection, slot } = describeEntry(row.original.timetableEntryId);
      return (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">{classSection}</span>
          <span className="text-xs text-muted-foreground">{slot}</span>
        </div>
      );
    },
  },
  {
    id: "original",
    header: "Original teacher",
    meta: { label: "Original teacher" },
    accessorFn: (row) => teacherName(row.originalTeacherId),
  },
  {
    id: "substitute",
    header: "Substitute",
    meta: { label: "Substitute" },
    accessorFn: (row) => teacherName(row.substituteTeacherId),
  },
  {
    accessorKey: "reason",
    header: "Reason",
    meta: { label: "Reason" },
    cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.reason ?? "—"}</span>,
  },
  {
    id: "status",
    header: "Status",
    meta: { label: "Status" },
    cell: ({ row }) => (
      <StatusDot tone={row.original.cancelledAt ? "neutral" : "success"}>{row.original.cancelledAt ? "Cancelled" : "Active"}</StatusDot>
    ),
  },
  {
    id: "actions",
    header: "",
    enableHiding: false,
    cell: ({ row }) => <SubstitutionRowActions substitution={row.original} />,
  },
];
