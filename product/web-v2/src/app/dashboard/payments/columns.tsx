"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { StatusDot, type StatusTone } from "@/components/status-dot";
import { getStudentById } from "@/lib/mock/students";
import type { Payment, PaymentMethod, PaymentStatus } from "@/lib/mock/payments";
import { PaymentRowActions } from "./row-actions";

const METHOD_LABEL: Record<PaymentMethod, string> = { CASH: "Cash", ONLINE: "Online" };
const STATUS_TONE: Record<PaymentStatus, StatusTone> = { SUCCESS: "success", REVERSED: "danger" };

export function getPaymentColumns(hasPendingReversal: (paymentId: string) => boolean, onRequestReversal: (payment: Payment) => void): ColumnDef<Payment>[] {
  return [
    {
      accessorKey: "paymentNumber",
      header: "Payment #",
      meta: { label: "Payment #" },
      cell: ({ row }) => <span className="font-mono text-sm text-foreground">{row.original.paymentNumber}</span>,
    },
    {
      id: "student",
      header: "Student",
      meta: { label: "Student" },
      accessorFn: (row) => getStudentById(row.studentId)?.fullName ?? row.studentId,
      cell: ({ row }) => <span className="font-medium text-foreground">{getStudentById(row.original.studentId)?.fullName ?? row.original.studentId}</span>,
    },
    {
      accessorKey: "amount",
      header: "Amount",
      meta: { label: "Amount" },
      cell: ({ row }) => <span className="font-mono text-sm">Rs {row.original.amount.toLocaleString()}</span>,
    },
    {
      accessorKey: "method",
      header: "Method",
      meta: { label: "Method" },
      cell: ({ row }) => METHOD_LABEL[row.original.method],
    },
    {
      accessorKey: "status",
      header: "Status",
      meta: { label: "Status" },
      cell: ({ row }) => <StatusDot tone={STATUS_TONE[row.original.status]}>{row.original.status === "SUCCESS" ? "Success" : "Reversed"}</StatusDot>,
    },
    {
      id: "actions",
      header: "",
      enableHiding: false,
      cell: ({ row }) => (
        <PaymentRowActions payment={row.original} pending={hasPendingReversal(row.original.id)} onRequestReversal={onRequestReversal} />
      ),
    },
  ];
}
