"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { StatusDot, type StatusTone } from "@/components/status-dot";
import { mockInvoices } from "@/lib/mock/invoices";
import { getStudentById } from "@/lib/mock/students";
import type { ApprovalStatus } from "@/lib/mock/discounts";
import type { Waiver } from "@/lib/mock/waivers";
import { WaiverRowActions } from "./row-actions";

const STATUS_TONE: Record<ApprovalStatus, StatusTone> = { PENDING: "warning", APPROVED: "success", REJECTED: "danger" };

export const waiverColumns: ColumnDef<Waiver>[] = [
  {
    id: "invoice",
    header: "Invoice",
    meta: { label: "Invoice" },
    cell: ({ row }) => {
      const invoice = mockInvoices.find((i) => i.id === row.original.invoiceId);
      return invoice ? (
        <Link href={`/dashboard/invoices/${invoice.id}`} className="font-mono text-sm text-foreground hover:underline">
          {invoice.invoiceNumber}
        </Link>
      ) : (
        row.original.invoiceId
      );
    },
  },
  {
    id: "student",
    header: "Student",
    meta: { label: "Student" },
    accessorFn: (row) => {
      const invoice = mockInvoices.find((i) => i.id === row.invoiceId);
      return invoice ? getStudentById(invoice.studentId)?.fullName : "";
    },
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
    cell: ({ row }) => <span className="line-clamp-2 max-w-xs text-sm text-muted-foreground">{row.original.reason}</span>,
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
    cell: ({ row }) => <WaiverRowActions waiver={row.original} />,
  },
];
