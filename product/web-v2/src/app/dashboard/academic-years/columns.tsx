"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { StatusDot } from "@/components/status-dot";
import type { AcademicYear } from "@/lib/mock/academic-years";
import { AcademicYearRowActions } from "./row-actions";

export const academicYearColumns: ColumnDef<AcademicYear>[] = [
  {
    accessorKey: "name",
    header: "Academic year",
    meta: { label: "Academic year" },
    cell: ({ row }) => <span className="font-medium text-foreground">{row.original.name}</span>,
  },
  {
    accessorKey: "startDate",
    header: "Starts",
    meta: { label: "Starts" },
    cell: ({ row }) => <span className="font-mono">{row.original.startDate}</span>,
  },
  {
    accessorKey: "endDate",
    header: "Ends",
    meta: { label: "Ends" },
    cell: ({ row }) => <span className="font-mono">{row.original.endDate}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    meta: { label: "Status" },
    cell: ({ row }) => (
      <StatusDot tone={row.original.status === "ACTIVE" ? "success" : "neutral"}>
        {row.original.status === "ACTIVE" ? "Active" : "Closed"}
      </StatusDot>
    ),
  },
  {
    id: "actions",
    header: "",
    enableHiding: false,
    cell: ({ row }) => <AcademicYearRowActions year={row.original} />,
  },
];
