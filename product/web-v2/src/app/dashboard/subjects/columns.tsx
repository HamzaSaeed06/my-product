"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { StatusDot } from "@/components/status-dot";
import type { Subject } from "@/lib/mock/subjects";
import { SubjectRowActions } from "./row-actions";

export const subjectColumns: ColumnDef<Subject>[] = [
  {
    accessorKey: "name",
    header: "Subject",
    meta: { label: "Subject" },
    cell: ({ row }) => <span className="font-medium text-foreground">{row.original.name}</span>,
  },
  {
    accessorKey: "code",
    header: "Code",
    meta: { label: "Code" },
    cell: ({ row }) => <span className="font-mono text-sm text-muted-foreground">{row.original.code ?? "—"}</span>,
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
    cell: ({ row }) => <SubjectRowActions subject={row.original} />,
  },
];
