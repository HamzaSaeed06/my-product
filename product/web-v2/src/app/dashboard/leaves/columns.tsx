"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { StatusDot, type StatusTone } from "@/components/status-dot";
import { getStudentById } from "@/lib/mock/students";
import { mockTeachers } from "@/lib/mock/teachers";
import { mockAppUsers } from "@/lib/mock/app-users";
import type { Leave, LeaveStatus } from "@/lib/mock/leaves";
import { LeaveRowActions } from "./row-actions";

const STATUS_TONE: Record<LeaveStatus, StatusTone> = { PENDING: "warning", APPROVED: "success", REJECTED: "danger", CANCELLED: "neutral" };
const STATUS_LABEL: Record<LeaveStatus, string> = { PENDING: "Pending", APPROVED: "Approved", REJECTED: "Rejected", CANCELLED: "Cancelled" };

function subjectName(leave: Leave) {
  if (leave.subjectType === "STUDENT") return leave.studentId ? getStudentById(leave.studentId)?.fullName : "";
  const teacher = mockTeachers.find((t) => t.id === leave.teacherId);
  return teacher ? mockAppUsers.find((u) => u.id === teacher.userId)?.fullName : "";
}

export const leaveColumns: ColumnDef<Leave>[] = [
  {
    id: "subject",
    header: "For",
    meta: { label: "For" },
    accessorFn: (row) => subjectName(row) ?? "",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium text-foreground">{subjectName(row.original)}</span>
        <span className="text-xs text-muted-foreground">{row.original.subjectType === "STUDENT" ? "Student" : "Teacher"}</span>
      </div>
    ),
  },
  {
    id: "dates",
    header: "Dates",
    meta: { label: "Dates" },
    cell: ({ row }) => (
      <span className="font-mono text-sm">
        {row.original.fromDate} → {row.original.toDate}
        {row.original.isRetrospective && <span className="ml-1.5 text-xs text-muted-foreground">(retrospective)</span>}
      </span>
    ),
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
    cell: ({ row }) => <LeaveRowActions leave={row.original} />,
  },
];
