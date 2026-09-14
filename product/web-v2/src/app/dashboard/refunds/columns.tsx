"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { StatusDot, type StatusTone } from "@/components/status-dot";
import { mockPayments } from "@/lib/mock/payments";
import { getStudentById } from "@/lib/mock/students";
import type { Refund, RefundStatus } from "@/lib/mock/refunds";
import { RefundRowActions } from "./row-actions";

const STATUS_TONE: Record<RefundStatus, StatusTone> = { PENDING: "warning", APPROVED: "warning", REJECTED: "danger", COMPLETED: "success" };
const STATUS_LABEL: Record<RefundStatus, string> = { PENDING: "Pending", APPROVED: "Approved", REJECTED: "Rejected", COMPLETED: "Completed" };

export const refundColumns: ColumnDef<Refund>[] = [
  {
    accessorKey: "refundNumber",
    header: "Refund #",
    meta: { label: "Refund #" },
    cell: ({ row }) => <span className="font-mono text-sm text-foreground">{row.original.refundNumber}</span>,
  },
  {
    id: "student",
    header: "Student",
    meta: { label: "Student" },
    accessorFn: (row) => {
      const payment = mockPayments.find((p) => p.id === row.paymentId);
      return payment ? getStudentById(payment.studentId)?.fullName : "";
    },
  },
  {
    id: "payment",
    header: "Payment",
    meta: { label: "Payment" },
    accessorFn: (row) => mockPayments.find((p) => p.id === row.paymentId)?.paymentNumber ?? row.paymentId,
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
    cell: ({ row }) => <StatusDot tone={STATUS_TONE[row.original.status]}>{STATUS_LABEL[row.original.status]}</StatusDot>,
  },
  {
    id: "actions",
    header: "",
    enableHiding: false,
    cell: ({ row }) => <RefundRowActions refund={row.original} />,
  },
];
