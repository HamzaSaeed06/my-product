"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { StatusDot } from "@/components/status-dot";
import { mockSubjects } from "@/lib/mock/subjects";
import { mockSections } from "@/lib/mock/sections";
import { mockClasses } from "@/lib/mock/classes";
import type { Assessment } from "@/lib/mock/assessments";
import { AssessmentRowActions } from "./row-actions";

export const assessmentColumns: ColumnDef<Assessment>[] = [
  {
    accessorKey: "title",
    header: "Title",
    meta: { label: "Title" },
    cell: ({ row }) => (
      <Link href={`/dashboard/assessments/${row.original.id}`} className="font-medium text-foreground hover:underline">
        {row.original.title}
      </Link>
    ),
  },
  {
    id: "subject",
    header: "Subject",
    meta: { label: "Subject" },
    accessorFn: (row) => mockSubjects.find((s) => s.id === row.subjectId)?.name ?? row.subjectId,
  },
  {
    id: "section",
    header: "Class / Section",
    meta: { label: "Class / Section" },
    accessorFn: (row) => {
      const section = mockSections.find((s) => s.id === row.sectionId);
      const className = mockClasses.find((c) => c.id === row.classId)?.name;
      return `${className} ${section?.name ?? ""}`;
    },
  },
  {
    accessorKey: "date",
    header: "Date",
    meta: { label: "Date" },
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.date}</span>,
  },
  {
    accessorKey: "maxMarks",
    header: "Max marks",
    meta: { label: "Max marks" },
  },
  {
    accessorKey: "status",
    header: "Status",
    meta: { label: "Status" },
    cell: ({ row }) => (
      <StatusDot tone={row.original.status === "SUBMITTED" ? "success" : "neutral"}>
        {row.original.status === "SUBMITTED" ? "Submitted" : "Draft"}
      </StatusDot>
    ),
  },
  {
    id: "actions",
    header: "",
    enableHiding: false,
    cell: ({ row }) => <AssessmentRowActions assessment={row.original} />,
  },
];
