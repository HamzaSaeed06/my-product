"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { StatusDot } from "@/components/status-dot";
import type { TeacherProfile } from "@/lib/mock/teachers";
import { mockAppUsers } from "@/lib/mock/app-users";
import { TeacherRowActions } from "./row-actions";

function userOf(id: string) {
  return mockAppUsers.find((u) => u.id === id);
}

export const teacherColumns: ColumnDef<TeacherProfile>[] = [
  {
    id: "name",
    header: "Teacher",
    meta: { label: "Teacher" },
    accessorFn: (row) => userOf(row.userId)?.fullName ?? row.userId,
    cell: ({ row }) => {
      const user = userOf(row.original.userId);
      return (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{user?.fullName}</span>
          <span className="text-xs text-muted-foreground">{user?.email}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "employeeCode",
    header: "Employee code",
    meta: { label: "Employee code" },
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.employeeCode ?? "—"}</span>,
  },
  {
    accessorKey: "qualification",
    header: "Qualification",
    meta: { label: "Qualification" },
    cell: ({ row }) => row.original.qualification ?? "—",
  },
  {
    accessorKey: "phone",
    header: "Phone",
    meta: { label: "Phone" },
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.phone ?? "—"}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    meta: { label: "Status" },
    cell: ({ row }) => (
      <StatusDot tone={row.original.status === "ACTIVE" ? "success" : "neutral"}>
        {row.original.status === "ACTIVE" ? "Active" : "Archived"}
      </StatusDot>
    ),
  },
  {
    id: "actions",
    header: "",
    enableHiding: false,
    cell: ({ row }) => <TeacherRowActions teacher={row.original} />,
  },
];
