"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { getStudentById } from "@/lib/mock/students";
import { mockFeeStructures } from "@/lib/mock/fee-structures";
import { mockFeeCategories } from "@/lib/mock/fee-categories";
import type { StudentFee } from "@/lib/mock/student-fees";
import { StudentFeeRowActions } from "./row-actions";

export const studentFeeColumns: ColumnDef<StudentFee>[] = [
  {
    id: "student",
    header: "Student",
    meta: { label: "Student" },
    accessorFn: (row) => getStudentById(row.studentId)?.fullName ?? row.studentId,
    cell: ({ row }) => {
      const student = getStudentById(row.original.studentId);
      return student ? (
        <Link href={`/dashboard/students/${student.id}`} className="font-medium text-foreground hover:underline">
          {student.fullName}
        </Link>
      ) : (
        row.original.studentId
      );
    },
  },
  {
    id: "structure",
    header: "Fee structure",
    meta: { label: "Fee structure" },
    accessorFn: (row) => mockFeeStructures.find((s) => s.id === row.feeStructureId)?.name ?? row.feeStructureId,
  },
  {
    id: "category",
    header: "Category",
    meta: { label: "Category" },
    accessorFn: (row) => {
      const structure = mockFeeStructures.find((s) => s.id === row.feeStructureId);
      return structure ? mockFeeCategories.find((c) => c.id === structure.feeCategoryId)?.name : "";
    },
  },
  {
    id: "amount",
    header: "Amount",
    meta: { label: "Amount" },
    cell: ({ row }) => {
      const structure = mockFeeStructures.find((s) => s.id === row.original.feeStructureId);
      const amount = row.original.overrideAmount ?? structure?.amount ?? 0;
      return (
        <span className="font-mono text-sm">
          Rs {amount.toLocaleString()}
          {row.original.overrideAmount !== null && <span className="ml-1 text-xs text-muted-foreground">(override)</span>}
        </span>
      );
    },
  },
  {
    accessorKey: "effectiveFrom",
    header: "Effective from",
    meta: { label: "Effective from" },
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.effectiveFrom}</span>,
  },
  {
    id: "actions",
    header: "",
    enableHiding: false,
    cell: ({ row }) => <StudentFeeRowActions studentFee={row.original} />,
  },
];
