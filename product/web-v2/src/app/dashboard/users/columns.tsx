"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { StatusDot } from "@/components/status-dot";
import type { AppUser } from "@/lib/mock/app-users";
import { mockCampuses } from "@/lib/mock/campuses";
import { UserRowActions } from "./row-actions";

export const userColumns: ColumnDef<AppUser>[] = [
  {
    accessorKey: "fullName",
    header: "User",
    meta: { label: "User" },
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium text-foreground">{row.original.fullName}</span>
        <span className="text-xs text-muted-foreground">{row.original.email}</span>
      </div>
    ),
  },
  {
    id: "roles",
    header: "Roles",
    meta: { label: "Roles" },
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {row.original.roles.length ? (
          row.original.roles.map((r) => (
            <span key={r.userRoleId} className="text-sm">
              {r.roleName}
              {r.campusId ? (
                <span className="text-muted-foreground"> · {mockCampuses.find((c) => c.id === r.campusId)?.name}</span>
              ) : null}
            </span>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">No roles</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    meta: { label: "Created" },
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.createdAt}</span>,
  },
  {
    accessorKey: "isActive",
    header: "Status",
    meta: { label: "Status" },
    cell: ({ row }) => (
      <StatusDot tone={row.original.isActive ? "success" : "neutral"}>
        {row.original.isActive ? "Active" : "Deactivated"}
      </StatusDot>
    ),
  },
  {
    id: "actions",
    header: "",
    enableHiding: false,
    cell: ({ row }) => <UserRowActions user={row.original} />,
  },
];
