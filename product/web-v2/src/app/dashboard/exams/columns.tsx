"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { StatusDot } from "@/components/status-dot";
import { mockAcademicYears } from "@/lib/mock/academic-years";
import type { Exam } from "@/lib/mock/exams";
import { ExamRowActions } from "./row-actions";

export const examColumns: ColumnDef<Exam>[] = [
  {
    accessorKey: "name",
    header: "Name",
    meta: { label: "Name" },
    cell: ({ row }) => (
      <Link href={`/dashboard/exams/${row.original.id}`} className="font-medium text-foreground hover:underline">
        {row.original.name}
      </Link>
    ),
  },
  {
    id: "academicYear",
    header: "Academic year",
    meta: { label: "Academic year" },
    accessorFn: (row) => mockAcademicYears.find((y) => y.id === row.academicYearId)?.name ?? row.academicYearId,
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
    cell: ({ row }) => <ExamRowActions exam={row.original} />,
  },
];
