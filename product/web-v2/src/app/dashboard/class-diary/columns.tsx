"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { mockSections } from "@/lib/mock/sections";
import { mockClasses } from "@/lib/mock/classes";
import { mockSubjects } from "@/lib/mock/subjects";
import { mockTeachers } from "@/lib/mock/teachers";
import { mockAppUsers } from "@/lib/mock/app-users";
import type { ClassDiaryEntry } from "@/lib/mock/class-diary";
import { ClassDiaryRowActions } from "./row-actions";

export function getClassDiaryColumns(onEdit: (entry: ClassDiaryEntry) => void): ColumnDef<ClassDiaryEntry>[] {
  return [
    {
      accessorKey: "date",
      header: "Date",
      meta: { label: "Date" },
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.date}</span>,
    },
    {
      id: "section",
      header: "Section",
      meta: { label: "Section" },
      accessorFn: (row) => {
        const section = mockSections.find((s) => s.id === row.sectionId);
        const className = section ? mockClasses.find((c) => c.id === section.classId)?.name : "";
        return `${className} ${section?.name ?? ""}`;
      },
    },
    {
      id: "subject",
      header: "Subject",
      meta: { label: "Subject" },
      cell: ({ row }) => {
        const subject = row.original.subjectId ? mockSubjects.find((s) => s.id === row.original.subjectId)?.name : null;
        return <span className={subject ? "" : "text-muted-foreground"}>{subject ?? "General"}</span>;
      },
    },
    {
      id: "teacher",
      header: "Teacher",
      meta: { label: "Teacher" },
      accessorFn: (row) => {
        const teacher = mockTeachers.find((t) => t.id === row.teacherId);
        return teacher ? mockAppUsers.find((u) => u.id === teacher.userId)?.fullName ?? row.teacherId : row.teacherId;
      },
    },
    {
      accessorKey: "note",
      header: "Note",
      meta: { label: "Note" },
      cell: ({ row }) => <span className="line-clamp-2 max-w-md text-sm text-muted-foreground">{row.original.note}</span>,
    },
    {
      id: "actions",
      header: "",
      enableHiding: false,
      cell: ({ row }) => <ClassDiaryRowActions entry={row.original} onEdit={onEdit} />,
    },
  ];
}
