"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { AdmissionInquiry } from "@/lib/mock/admission-inquiries";
import { mockCampuses } from "@/lib/mock/campuses";
import { mockClasses } from "@/lib/mock/classes";
import { InquiryStatusPopover } from "./status-popover";
import { InquiryRowActions } from "./row-actions";

export const inquiryColumns: ColumnDef<AdmissionInquiry>[] = [
  {
    accessorKey: "childName",
    header: "Child",
    meta: { label: "Child" },
    cell: ({ row }) => <span className="font-medium text-foreground">{row.original.childName}</span>,
  },
  {
    id: "parent",
    header: "Parent",
    meta: { label: "Parent" },
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span>{row.original.parentName}</span>
        <span className="font-mono text-xs text-muted-foreground">{row.original.parentPhone}</span>
      </div>
    ),
  },
  {
    id: "campus",
    header: "Campus",
    meta: { label: "Campus" },
    accessorFn: (row) => mockCampuses.find((c) => c.id === row.campusId)?.name ?? row.campusId,
  },
  {
    id: "class",
    header: "Class",
    meta: { label: "Class" },
    cell: ({ row }) => (row.original.classId ? mockClasses.find((c) => c.id === row.original.classId)?.name : "—"),
  },
  {
    accessorKey: "source",
    header: "Source",
    meta: { label: "Source" },
    cell: ({ row }) => row.original.source ?? "—",
  },
  {
    accessorKey: "createdAt",
    header: "Logged",
    meta: { label: "Logged" },
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.createdAt}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    meta: { label: "Status" },
    cell: ({ row }) => <InquiryStatusPopover inquiry={row.original} />,
  },
  {
    id: "actions",
    header: "",
    enableHiding: false,
    cell: ({ row }) => <InquiryRowActions inquiry={row.original} />,
  },
];
