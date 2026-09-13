"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import type { Parent } from "@/lib/mock/parents";
import { ChildrenCell } from "./children-cell";
import { ParentRowActions } from "./row-actions";

export const parentColumns: ColumnDef<Parent>[] = [
  {
    accessorKey: "fullName",
    header: "Parent",
    meta: { label: "Parent" },
    cell: ({ row }) => (
      <Link href={`/dashboard/parents/${row.original.id}`} className="font-medium text-foreground hover:underline">
        {row.original.fullName}
      </Link>
    ),
  },
  {
    id: "contact",
    header: "Contact",
    meta: { label: "Contact" },
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-mono text-sm">{row.original.phone}</span>
        {row.original.email ? <span className="text-xs text-muted-foreground">{row.original.email}</span> : null}
      </div>
    ),
  },
  {
    id: "children",
    header: "Children",
    meta: { label: "Children" },
    cell: ({ row }) => <ChildrenCell parent={row.original} />,
  },
  {
    id: "actions",
    header: "",
    enableHiding: false,
    cell: ({ row }) => <ParentRowActions parent={row.original} />,
  },
];
