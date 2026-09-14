"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusDot, type StatusTone } from "@/components/status-dot";
import { getStudentById } from "@/lib/mock/students";
import { mockCampuses } from "@/lib/mock/campuses";
import { mockAppUsers } from "@/lib/mock/app-users";
import type { Complaint, ComplaintStatus } from "@/lib/mock/complaints";

const STATUS_TONE: Record<ComplaintStatus, StatusTone> = { OPEN: "neutral", ASSIGNED: "warning", IN_PROGRESS: "warning", RESOLVED: "success", CLOSED: "success" };
const STATUS_LABEL: Record<ComplaintStatus, string> = { OPEN: "Open", ASSIGNED: "Assigned", IN_PROGRESS: "In progress", RESOLVED: "Resolved", CLOSED: "Closed" };

export const complaintColumns: ColumnDef<Complaint>[] = [
  {
    accessorKey: "category",
    header: "Category",
    meta: { label: "Category" },
    cell: ({ row }) => <span className="font-medium text-foreground">{row.original.category}</span>,
  },
  {
    id: "student",
    header: "Student",
    meta: { label: "Student" },
    accessorFn: (row) => (row.studentId ? getStudentById(row.studentId)?.fullName : "General"),
    cell: ({ row }) => (row.original.studentId ? getStudentById(row.original.studentId)?.fullName : <span className="text-muted-foreground">General</span>),
  },
  {
    id: "campus",
    header: "Campus",
    meta: { label: "Campus" },
    accessorFn: (row) => mockCampuses.find((c) => c.id === row.campusId)?.name ?? row.campusId,
  },
  {
    id: "assignedTo",
    header: "Assigned to",
    meta: { label: "Assigned to" },
    cell: ({ row }) => (row.original.assignedToId ? mockAppUsers.find((u) => u.id === row.original.assignedToId)?.fullName : <span className="text-muted-foreground">Unassigned</span>),
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
    cell: ({ row }) => (
      <Button variant="outline" size="sm" render={<Link href={`/dashboard/complaints/${row.original.id}`} />}>
        <Eye className="size-3.5" />
        View
      </Button>
    ),
  },
];
