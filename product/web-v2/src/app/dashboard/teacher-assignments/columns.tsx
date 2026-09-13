"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { StatusDot } from "@/components/status-dot";
import type { TeacherAssignment } from "@/lib/mock/teacher-assignments";
import { mockTeachers } from "@/lib/mock/teachers";
import { mockAppUsers } from "@/lib/mock/app-users";
import { mockSubjects } from "@/lib/mock/subjects";
import { mockSections } from "@/lib/mock/sections";
import { mockClasses } from "@/lib/mock/classes";
import { mockCampuses } from "@/lib/mock/campuses";
import { AssignmentRowActions } from "./row-actions";

function teacherNameOf(teacherId: string) {
  const teacher = mockTeachers.find((t) => t.id === teacherId);
  return teacher ? (mockAppUsers.find((u) => u.id === teacher.userId)?.fullName ?? teacherId) : teacherId;
}
function subjectNameOf(id: string) {
  return mockSubjects.find((s) => s.id === id)?.name ?? id;
}
function sectionOf(id: string) {
  return mockSections.find((s) => s.id === id);
}

export const assignmentColumns: ColumnDef<TeacherAssignment>[] = [
  {
    id: "teacher",
    header: "Teacher",
    meta: { label: "Teacher" },
    accessorFn: (row) => teacherNameOf(row.teacherId),
    cell: ({ row }) => <span className="font-medium text-foreground">{teacherNameOf(row.original.teacherId)}</span>,
  },
  {
    id: "subject",
    header: "Subject",
    meta: { label: "Subject" },
    accessorFn: (row) => subjectNameOf(row.subjectId),
  },
  {
    id: "class",
    header: "Class / Section",
    meta: { label: "Class / Section" },
    cell: ({ row }) => {
      const section = sectionOf(row.original.sectionId);
      const className = section ? mockClasses.find((c) => c.id === section.classId)?.name : "";
      return `${className} ${section?.name ?? ""}`;
    },
  },
  {
    id: "campus",
    header: "Campus",
    meta: { label: "Campus" },
    cell: ({ row }) => {
      const section = sectionOf(row.original.sectionId);
      return section ? (mockCampuses.find((c) => c.id === section.campusId)?.name ?? "—") : "—";
    },
  },
  {
    accessorKey: "archived",
    header: "Status",
    meta: { label: "Status" },
    cell: ({ row }) => (
      <StatusDot tone={row.original.archived ? "neutral" : "success"}>
        {row.original.archived ? "Ended" : "Active"}
      </StatusDot>
    ),
  },
  {
    id: "actions",
    header: "",
    enableHiding: false,
    cell: ({ row }) => <AssignmentRowActions assignment={row.original} />,
  },
];
