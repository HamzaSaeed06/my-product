"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { StatusDot, type StatusTone } from "@/components/status-dot";
import { getStudentById } from "@/lib/mock/students";
import { mockFeeStructures } from "@/lib/mock/fee-structures";
import type { ApprovalStatus, Discount, DiscountType } from "@/lib/mock/discounts";
import { DiscountRowActions } from "./row-actions";

const TYPE_LABEL: Record<DiscountType, string> = { SIBLING: "Sibling", MERIT: "Merit", STAFF: "Staff", OTHER: "Other" };
const STATUS_TONE: Record<ApprovalStatus, StatusTone> = { PENDING: "warning", APPROVED: "success", REJECTED: "danger" };

export const discountColumns: ColumnDef<Discount>[] = [
  {
    id: "student",
    header: "Student",
    meta: { label: "Student" },
    accessorFn: (row) => getStudentById(row.studentId)?.fullName ?? row.studentId,
    cell: ({ row }) => <span className="font-medium text-foreground">{getStudentById(row.original.studentId)?.fullName ?? row.original.studentId}</span>,
  },
  {
    id: "appliesTo",
    header: "Applies to",
    meta: { label: "Applies to" },
    accessorFn: (row) => (row.feeStructureId ? mockFeeStructures.find((s) => s.id === row.feeStructureId)?.name : "Student-wide"),
  },
  {
    accessorKey: "type",
    header: "Type",
    meta: { label: "Type" },
    cell: ({ row }) => TYPE_LABEL[row.original.type],
  },
  {
    id: "value",
    header: "Discount",
    meta: { label: "Discount" },
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.percentage !== null ? `${row.original.percentage}%` : `Rs ${row.original.amount?.toLocaleString()}`}</span>,
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
    cell: ({ row }) => <DiscountRowActions discount={row.original} />,
  },
];
