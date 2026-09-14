"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { StatusDot, type StatusTone } from "@/components/status-dot";
import { getStudentById } from "@/lib/mock/students";
import type { Invoice, InvoiceStatus } from "@/lib/mock/invoices";
import { InvoiceRowActions } from "./row-actions";

const STATUS_TONE: Record<InvoiceStatus, StatusTone> = { UNPAID: "neutral", PARTIALLY_PAID: "warning", PAID: "success", VOID: "danger" };
const STATUS_LABEL: Record<InvoiceStatus, string> = { UNPAID: "Unpaid", PARTIALLY_PAID: "Partially paid", PAID: "Paid", VOID: "Void" };

export const invoiceColumns: ColumnDef<Invoice>[] = [
  {
    accessorKey: "invoiceNumber",
    header: "Invoice #",
    meta: { label: "Invoice #" },
    cell: ({ row }) => <span className="font-mono text-sm text-foreground">{row.original.invoiceNumber}</span>,
  },
  {
    id: "student",
    header: "Student",
    meta: { label: "Student" },
    accessorFn: (row) => getStudentById(row.studentId)?.fullName ?? row.studentId,
    cell: ({ row }) => <span className="font-medium text-foreground">{getStudentById(row.original.studentId)?.fullName ?? row.original.studentId}</span>,
  },
  {
    accessorKey: "totalAmount",
    header: "Total",
    meta: { label: "Total" },
    cell: ({ row }) => <span className="font-mono text-sm">Rs {row.original.totalAmount.toLocaleString()}</span>,
  },
  {
    accessorKey: "dueDate",
    header: "Due date",
    meta: { label: "Due date" },
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.dueDate}</span>,
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
    cell: ({ row }) => <InvoiceRowActions invoice={row.original} />,
  },
];
