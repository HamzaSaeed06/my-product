"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Paperclip } from "lucide-react";
import { StatusDot } from "@/components/status-dot";
import { mockSubjects } from "@/lib/mock/subjects";
import { mockSections } from "@/lib/mock/sections";
import { mockClasses } from "@/lib/mock/classes";
import { mockTeachers } from "@/lib/mock/teachers";
import { mockAppUsers } from "@/lib/mock/app-users";
import { mockHomeworkAttachments, type Homework } from "@/lib/mock/homework";
import { HomeworkRowActions } from "./row-actions";

export const homeworkColumns: ColumnDef<Homework>[] = [
  {
    accessorKey: "title",
    header: "Title",
    meta: { label: "Title" },
    cell: ({ row }) => {
      const count = mockHomeworkAttachments.filter((a) => a.homeworkId === row.original.id).length;
      return (
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-foreground">{row.original.title}</span>
          {count > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
              <Paperclip className="size-3" />
              {count}
            </span>
          )}
        </div>
      );
    },
  },
  {
    id: "class",
    header: "Class / Section",
    meta: { label: "Class / Section" },
    accessorFn: (row) => {
      const section = mockSections.find((s) => s.id === row.sectionId);
      const className = mockClasses.find((c) => c.id === row.classId)?.name;
      return `${className} ${section?.name ?? ""}`;
    },
  },
  {
    id: "subject",
    header: "Subject",
    meta: { label: "Subject" },
    accessorFn: (row) => mockSubjects.find((s) => s.id === row.subjectId)?.name ?? row.subjectId,
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
    accessorKey: "dueDate",
    header: "Due",
    meta: { label: "Due" },
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.dueDate}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    meta: { label: "Status" },
    cell: ({ row }) => (
      <StatusDot tone={row.original.status === "PUBLISHED" ? "success" : "neutral"}>
        {row.original.status === "PUBLISHED" ? "Published" : "Draft"}
      </StatusDot>
    ),
  },
  {
    id: "actions",
    header: "",
    enableHiding: false,
    cell: ({ row }) => <HomeworkRowActions homework={row.original} />,
  },
];
