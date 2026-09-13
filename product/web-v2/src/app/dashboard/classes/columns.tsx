"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { StatusDot } from "@/components/status-dot";
import type { SchoolClass } from "@/lib/mock/classes";
import { ClassRowActions } from "./row-actions";

export const classColumns: ColumnDef<SchoolClass>[] = [
  {
    accessorKey: "name",
    header: "Class",
    meta: { label: "Class" },
    cell: ({ row }) => <span className="font-medium text-foreground">{row.original.name}</span>,
  },
  {
    accessorKey: "sortOrder",
    header: "Sort order",
    meta: { label: "Sort order" },
    cell: ({ row }) => <span className="font-mono tabular-nums">{row.original.sortOrder}</span>,
  },
  {
    accessorKey: "archived",
    header: "Status",
    meta: { label: "Status" },
    cell: ({ row }) => (
      <StatusDot tone={row.original.archived ? "neutral" : "success"}>
        {row.original.archived ? "Archived" : "Active"}
      </StatusDot>
    ),
  },
  {
    id: "actions",
    header: "",
    enableHiding: false,
    cell: ({ row }) => <ClassRowActions schoolClass={row.original} />,
  },
];
