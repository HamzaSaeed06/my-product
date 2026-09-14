"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { StatusDot } from "@/components/status-dot";
import { mockAppUsers } from "@/lib/mock/app-users";
import { mockRolePermissions } from "@/lib/mock/role-permissions";
import type { RoleDef } from "@/lib/mock/roles";
import { RoleRowActions } from "./row-actions";

export function usersAssignedTo(roleId: string) {
  return mockAppUsers.flatMap((u) => u.roles).filter((r) => r.roleId === roleId).length;
}

export const roleColumns: ColumnDef<RoleDef>[] = [
  {
    accessorKey: "name",
    header: "Role",
    meta: { label: "Role" },
    cell: ({ row }) => <span className="font-medium text-foreground">{row.original.name}</span>,
  },
  {
    id: "type",
    header: "Type",
    meta: { label: "Type" },
    cell: ({ row }) => <StatusDot tone={row.original.systemKey ? "neutral" : "success"}>{row.original.systemKey ? "System" : "Custom"}</StatusDot>,
  },
  {
    id: "permissions",
    header: "Permissions",
    meta: { label: "Permissions" },
    accessorFn: (row) => mockRolePermissions.filter((g) => g.roleId === row.id).length,
  },
  {
    id: "users",
    header: "Users",
    meta: { label: "Users" },
    accessorFn: (row) => usersAssignedTo(row.id),
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
    cell: ({ row }) => <RoleRowActions role={row.original} />,
  },
];
