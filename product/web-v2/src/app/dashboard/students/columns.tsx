"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const FEE_STATUS_CLASS: Record<Student["feeStatus"], string> = {
  PAID: "bg-success/10 text-success border-success/30",
  DUE: "bg-signal/10 text-signal-foreground border-signal/30",
  OVERDUE: "bg-destructive/10 text-destructive border-destructive/30",
};

export const studentColumns: ColumnDef<Student>[] = [
  {
    accessorKey: "fullName",
    header: sortableHeader("Student"),
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
  },
  {
    id: "class_section",
    header: "Class",
    accessorFn: (row) => `${row.className} - ${row.section}`,
  },
  {
    accessorKey: "guardianName",
    header: "Guardian",
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
    cell: ({ row }) => <span className="font-mono tabular-nums">{row.original.attendancePct}%</span>,
  },
  {
    accessorKey: "feeStatus",
    header: "Fee status",
    cell: ({ row }) => (
      <Badge variant="outline" className={FEE_STATUS_CLASS[row.original.feeStatus]}>
        {row.original.feeStatus}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StudentStatusPopover student={row.original} />,
  },
  {
    id: "actions",
    header: "",
    enableHiding: false,
    cell: ({ row }) => <StudentRowActions student={row.original} />,
  },
];
