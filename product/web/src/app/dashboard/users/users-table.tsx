"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { AssignRoleDialog, RemoveRoleButton, ToggleActiveButton } from "./user-dialogs";

interface UserRow {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  mfaEnabled: boolean;
  createdAt: string;
  roles: { userRoleId: string; roleId: string; roleName: string; campusId: string | null }[];
}
interface RoleOption {
  id: string;
  name: string;
  archivedAt: string | null;
}
interface CampusOption {
  id: string;
  name: string;
}

// Client wrapper for the Server/Client boundary reason documented in
// DESIGN.md — the page fetches (and resolves permissions), this owns the
// DataTable column defs.
export function UsersTable({
  users,
  activeRoles,
  campuses,
  canViewCampuses,
  canEdit,
  canDisable,
  canAssignRoles,
}: {
  users: UserRow[];
  activeRoles: RoleOption[];
  campuses: CampusOption[];
  canViewCampuses: boolean;
  canEdit: boolean;
  canDisable: boolean;
  canAssignRoles: boolean;
}) {
  const canAct = canEdit || canDisable;

  const campusName = (id: string | null) =>
    id ? (campuses.find((c) => c.id === id)?.name ?? (canViewCampuses ? "Unknown campus" : "Other campus")) : "All campuses";

  const columns: DataTableColumn<UserRow>[] = [
    {
      key: "name",
      header: "Name",
      sortValue: (u) => u.fullName,
      render: (u) => <span className="font-medium">{u.fullName}</span>,
    },
    {
      key: "email",
      header: "Email",
      sortValue: (u) => u.email,
      render: (u) => <span className="text-muted-foreground">{u.email}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortValue: (u) => (u.isActive ? "Active" : "Disabled"),
      render: (u) => (u.isActive ? <Badge>Active</Badge> : <Badge variant="secondary">Disabled</Badge>),
    },
    {
      key: "roles",
      header: "Roles",
      render: (u) =>
        u.roles.length === 0 ? (
          <span className="text-sm text-muted-foreground">No roles</span>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {u.roles.map((role) => (
              <div key={role.userRoleId} className="flex items-center gap-1">
                <Badge variant="outline" title={campusName(role.campusId)}>
                  {role.roleName}
                  {role.campusId ? ` · ${campusName(role.campusId)}` : ""}
                </Badge>
              </div>
            ))}
          </div>
        ),
    },
  ];

  if (canAct) {
    columns.push({
      key: "actions",
      header: "Actions",
      align: "right",
      render: (u) => (
        <div className="flex flex-wrap justify-end gap-2">
          {canAssignRoles ? <AssignRoleDialog userId={u.id} userName={u.fullName} roles={activeRoles} campuses={campuses} /> : null}
          {canEdit
            ? u.roles.map((role) => (
                <RemoveRoleButton
                  key={role.userRoleId}
                  userId={u.id}
                  userRoleId={role.userRoleId}
                  roleName={`${role.roleName}${role.campusId ? ` (${campusName(role.campusId)})` : ""}`}
                />
              ))
            : null}
          {canDisable ? <ToggleActiveButton userId={u.id} isActive={u.isActive} /> : null}
        </div>
      ),
    });
  }

  return (
    <DataTable
      columns={columns}
      data={users}
      getRowKey={(u) => u.id}
      searchPlaceholder="Search users..."
      searchText={(u) => `${u.fullName} ${u.email}`}
      emptyMessage='No users yet. Click "Add user" to create one.'
      pageSize={15}
    />
  );
}
