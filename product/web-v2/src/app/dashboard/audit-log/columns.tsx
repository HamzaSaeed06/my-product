"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { mockAppUsers } from "@/lib/mock/app-users";
import type { AuditLogEntry } from "@/lib/mock/audit-log";

export const auditLogColumns: ColumnDef<AuditLogEntry>[] = [
  {
    accessorKey: "createdAt",
    header: "When",
    meta: { label: "When" },
    cell: ({ row }) => <span className="font-mono text-sm">{new Date(row.original.createdAt).toLocaleString()}</span>,
  },
  {
    id: "actor",
    header: "Actor",
    meta: { label: "Actor" },
    accessorFn: (row) => mockAppUsers.find((u) => u.id === row.actorId)?.fullName ?? row.actorId,
  },
  {
    accessorKey: "action",
    header: "Action",
    meta: { label: "Action" },
    cell: ({ row }) => <span className="font-mono text-xs uppercase text-muted-foreground">{row.original.action}</span>,
  },
  {
    accessorKey: "resource",
    header: "Resource",
    meta: { label: "Resource" },
  },
  {
    accessorKey: "recordId",
    header: "Record",
    meta: { label: "Record" },
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.recordId}</span>,
  },
  {
    accessorKey: "reason",
    header: "Reason",
    meta: { label: "Reason" },
    cell: ({ row }) => <span className="line-clamp-1 max-w-xs text-sm text-muted-foreground">{row.original.reason ?? "—"}</span>,
  },
];
