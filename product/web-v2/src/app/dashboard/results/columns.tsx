"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusDot, type StatusTone } from "@/components/status-dot";
import type { Result, ResultStatus } from "@/lib/mock/results";

export interface ResultTableRow extends Result {
  studentName: string;
  admissionNo: string;
  total: number;
  maxTotal: number;
}

const STAGE_TONE: Record<ResultStatus, StatusTone> = {
  DRAFT: "neutral",
  SUBMITTED: "warning",
  REVIEWED: "warning",
  FINALIZED: "success",
  PUBLISHED: "success",
};

const STAGE_LABEL: Record<ResultStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  REVIEWED: "Reviewed",
  FINALIZED: "Finalized",
  PUBLISHED: "Published",
};

// A plain DataTable, same as every other list page — the row itself is
// read-only; opening a result (via the "View" button) is where marks get
// entered/edited and the status gets advanced, exactly like Assessments'
// list+detail split. An explicit button, not just a name link, so opening
// a row doesn't depend on noticing it's clickable.
export const resultColumns: ColumnDef<ResultTableRow>[] = [
  {
    accessorKey: "studentName",
    header: "Student",
    meta: { label: "Student" },
    cell: ({ row }) => <span className="font-medium text-foreground">{row.original.studentName}</span>,
  },
  {
    accessorKey: "admissionNo",
    header: "Admission No.",
    meta: { label: "Admission No." },
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.admissionNo}</span>,
  },
  {
    id: "total",
    header: "Total",
    meta: { label: "Total" },
    cell: ({ row }) => (
      <span className="font-mono text-sm">
        {row.original.total} / {row.original.maxTotal}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    meta: { label: "Status" },
    cell: ({ row }) => <StatusDot tone={STAGE_TONE[row.original.status]}>{STAGE_LABEL[row.original.status]}</StatusDot>,
  },
  {
    id: "actions",
    header: "",
    enableHiding: false,
    cell: ({ row }) => (
      <Button variant="outline" size="sm" render={<Link href={`/dashboard/results/${row.original.id}`} />}>
        <Eye className="size-3.5" />
        View
      </Button>
    ),
  },
];
