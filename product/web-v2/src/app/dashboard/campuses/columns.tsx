"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { StatusDot } from "@/components/status-dot";
import type { CampusOverview } from "@/lib/mock/campuses";
import { CampusRowActions } from "./row-actions";

export const campusColumns: ColumnDef<CampusOverview>[] = [
  {
    accessorKey: "name",
    header: "Campus",
    meta: { label: "Campus" },
    cell: ({ row }) => (
      <Link href={`/dashboard/campuses/${row.original.id}`} className="font-medium text-foreground hover:underline">
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: "students",
    header: "Students",
    meta: { label: "Students" },
    cell: ({ row }) => <span className="font-mono tabular-nums">{row.original.students.toLocaleString()}</span>,
  },
  {
    accessorKey: "teachers",
    header: "Teachers",
    meta: { label: "Teachers" },
    cell: ({ row }) => <span className="font-mono tabular-nums">{row.original.teachers}</span>,
  },
  {
    accessorKey: "sections",
    header: "Sections",
    meta: { label: "Sections" },
    cell: ({ row }) => <span className="font-mono tabular-nums">{row.original.sections}</span>,
  },
  {
    id: "status",
    header: "Status",
    meta: { label: "Status" },
    cell: () => <StatusDot tone="success">Active</StatusDot>,
  },
  {
    id: "actions",
    header: "",
    enableHiding: false,
    cell: ({ row }) => <CampusRowActions campus={row.original} />,
  },
];
