"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusDot, type StatusTone } from "@/components/status-dot";
import type { Student } from "@/lib/mock/students";
import { StudentRowActions } from "./student-row-actions";
import { StudentStatusPopover } from "./student-status-popover";

function sortableHeader(label: string) {
  return function Header({ column }: { column: { toggleSorting: (asc: boolean) => void; getIsSorted: () => false | "asc" | "desc" } }) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 gap-1.5"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        {label}
        <ArrowUpDown className="size-3.5" />
      </Button>
    );
  };
}

const FEE_STATUS_TONE: Record<Student["feeStatus"], StatusTone> = {
  PAID: "success",
  DUE: "warning",
  OVERDUE: "danger",
};

const FEE_STATUS_LABEL: Record<Student["feeStatus"], string> = {
  PAID: "Paid",
  DUE: "Due",
  OVERDUE: "Overdue",
};

export const studentColumns: ColumnDef<Student>[] = [
  {
    accessorKey: "fullName",
    header: sortableHeader("Student"),
    meta: { label: "Student" },
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium text-foreground">{row.original.fullName}</span>
        <span className="font-mono text-xs text-muted-foreground">{row.original.admissionNo}</span>
      </div>
    ),
  },
  {
    accessorKey: "campusName",
    header: "Campus",
    meta: { label: "Campus" },
  },
  {
    id: "class_section",
    header: "Class",
    meta: { label: "Class" },
    accessorFn: (row) => `${row.className} - ${row.section}`,
  },
  {
    accessorKey: "guardianName",
    header: "Guardian",
    meta: { label: "Guardian" },
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span>{row.original.guardianName}</span>
        <span className="font-mono text-xs text-muted-foreground">{row.original.guardianPhone}</span>
      </div>
    ),
  },
  {
    accessorKey: "attendancePct",
    header: sortableHeader("Attendance"),
    meta: { label: "Attendance" },
    cell: ({ row }) => <span className="font-mono tabular-nums">{row.original.attendancePct}%</span>,
  },
  {
    accessorKey: "feeStatus",
    header: "Fee status",
    meta: { label: "Fee status" },
    cell: ({ row }) => (
      <StatusDot tone={FEE_STATUS_TONE[row.original.feeStatus]}>{FEE_STATUS_LABEL[row.original.feeStatus]}</StatusDot>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    meta: { label: "Status" },
    cell: ({ row }) => <StudentStatusPopover student={row.original} />,
  },
  {
    id: "actions",
    header: "",
    enableHiding: false,
    cell: ({ row }) => <StudentRowActions student={row.original} />,
  },
];
