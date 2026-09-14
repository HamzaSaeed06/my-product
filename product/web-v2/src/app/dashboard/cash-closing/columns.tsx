"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { StatusDot } from "@/components/status-dot";
import { mockCampuses } from "@/lib/mock/campuses";
import type { CashClosing } from "@/lib/mock/cash-closing";
import { CashClosingRowActions } from "./row-actions";

export const cashClosingColumns: ColumnDef<CashClosing>[] = [
  {
    accessorKey: "date",
    header: "Date",
    meta: { label: "Date" },
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.date}</span>,
  },
  {
    id: "campus",
    header: "Campus",
    meta: { label: "Campus" },
    accessorFn: (row) => mockCampuses.find((c) => c.id === row.campusId)?.name ?? row.campusId,
  },
  {
    accessorKey: "collections",
    header: "Collections",
    meta: { label: "Collections" },
    cell: ({ row }) => <span className="font-mono text-sm">Rs {row.original.collections.toLocaleString()}</span>,
  },
  {
    accessorKey: "expectedBalance",
    header: "Expected",
    meta: { label: "Expected" },
    cell: ({ row }) => <span className="font-mono text-sm">Rs {row.original.expectedBalance.toLocaleString()}</span>,
  },
  {
    accessorKey: "actualBalance",
    header: "Actual",
    meta: { label: "Actual" },
    cell: ({ row }) => <span className="font-mono text-sm">Rs {row.original.actualBalance.toLocaleString()}</span>,
  },
  {
    accessorKey: "variance",
    header: "Variance",
    meta: { label: "Variance" },
    cell: ({ row }) => {
      const v = row.original.variance;
      return <span className={`font-mono text-sm ${v === 0 ? "text-foreground" : v > 0 ? "text-success" : "text-destructive"}`}>{v >= 0 ? "+" : ""}{v.toLocaleString()}</span>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    meta: { label: "Status" },
    cell: ({ row }) => <StatusDot tone={row.original.status === "APPROVED" ? "success" : "warning"}>{row.original.status === "APPROVED" ? "Approved" : "Pending"}</StatusDot>,
  },
  {
    id: "actions",
    header: "",
    enableHiding: false,
    cell: ({ row }) => <CashClosingRowActions closing={row.original} />,
  },
];
