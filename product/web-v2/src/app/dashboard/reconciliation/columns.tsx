"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { StatusDot, type StatusTone } from "@/components/status-dot";
import type { ExceptionStatus, ReconciliationException } from "@/lib/mock/reconciliation";
import { ExceptionRowActions } from "./row-actions";

const STATUS_TONE: Record<ExceptionStatus, StatusTone> = { PENDING: "warning", RESOLVED: "success", REJECTED: "danger" };

export const exceptionColumns: ColumnDef<ReconciliationException>[] = [
  {
    accessorKey: "gatewayTransactionId",
    header: "Gateway transaction",
    meta: { label: "Gateway transaction" },
    cell: ({ row }) => <span className="font-mono text-sm text-foreground">{row.original.gatewayTransactionId}</span>,
  },
  {
    accessorKey: "amount",
    header: "Amount",
    meta: { label: "Amount" },
    cell: ({ row }) => <span className="font-mono text-sm">Rs {row.original.amount.toLocaleString()}</span>,
  },
  {
    accessorKey: "reason",
    header: "Reason",
    meta: { label: "Reason" },
    cell: ({ row }) => <span className="line-clamp-2 max-w-md text-sm text-muted-foreground">{row.original.reason}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    meta: { label: "Status" },
    cell: ({ row }) => <StatusDot tone={STATUS_TONE[row.original.status]}>{row.original.status.charAt(0) + row.original.status.slice(1).toLowerCase()}</StatusDot>,
  },
  {
    id: "actions",
    header: "",
    enableHiding: false,
    cell: ({ row }) => <ExceptionRowActions exception={row.original} />,
  },
];
