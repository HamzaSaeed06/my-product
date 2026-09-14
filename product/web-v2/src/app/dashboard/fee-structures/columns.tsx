"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { StatusDot } from "@/components/status-dot";
import { mockFeeCategories } from "@/lib/mock/fee-categories";
import { mockClasses } from "@/lib/mock/classes";
import { mockCampuses } from "@/lib/mock/campuses";
import type { FeeFrequency, FeeStructure } from "@/lib/mock/fee-structures";
import { FeeStructureRowActions } from "./row-actions";

const FREQUENCY_LABEL: Record<FeeFrequency, string> = { MONTHLY: "Monthly", ANNUAL: "Annual", ONE_TIME: "One-time" };

export const feeStructureColumns: ColumnDef<FeeStructure>[] = [
  {
    accessorKey: "name",
    header: "Name",
    meta: { label: "Name" },
    cell: ({ row }) => <span className="font-medium text-foreground">{row.original.name}</span>,
  },
  {
    id: "category",
    header: "Category",
    meta: { label: "Category" },
    accessorFn: (row) => mockFeeCategories.find((c) => c.id === row.feeCategoryId)?.name ?? row.feeCategoryId,
  },
  {
    id: "class",
    header: "Class",
    meta: { label: "Class" },
    accessorFn: (row) => mockClasses.find((c) => c.id === row.classId)?.name ?? row.classId,
  },
  {
    id: "campus",
    header: "Campus",
    meta: { label: "Campus" },
    accessorFn: (row) => (row.campusId ? mockCampuses.find((c) => c.id === row.campusId)?.name ?? row.campusId : "All campuses"),
  },
  {
    accessorKey: "amount",
    header: "Amount",
    meta: { label: "Amount" },
    cell: ({ row }) => <span className="font-mono text-sm">Rs {row.original.amount.toLocaleString()}</span>,
  },
  {
    accessorKey: "frequency",
    header: "Frequency",
    meta: { label: "Frequency" },
    cell: ({ row }) => FREQUENCY_LABEL[row.original.frequency],
  },
  {
    id: "status",
    header: "Status",
    meta: { label: "Status" },
    cell: ({ row }) => <StatusDot tone={row.original.archivedAt ? "neutral" : "success"}>{row.original.archivedAt ? "Archived" : "Active"}</StatusDot>,
  },
  {
    id: "actions",
    header: "",
    enableHiding: false,
    cell: ({ row }) => <FeeStructureRowActions structure={row.original} />,
  },
];
