import { apiRequest } from "@/lib/apiClient";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreateUserDialog, AssignRoleDialog, RemoveRoleButton, ToggleActiveButton } from "./user-dialogs";

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

export default async function UsersPage() {
  const [currentUser, users] = await Promise.all([getCurrentUser(), apiRequest<UserRow[]>("/api/v1/users")]);

  // Mirrors the exact permission each route requires (see users/routes.ts
  // and roles/routes.ts) — a viewer who can only user.view (e.g.
  // CAMPUS_HEAD, which currently holds no role.* or user.create/edit/disable
  // grant at all) must never see role-assign/remove or activate/deactivate
  // controls the backend would 403 on anyway. This also fixes a real crash:
  // the page used to fetch /api/v1/roles unconditionally for the "Assign
  // role" dropdown, which 403'd outright for a user.view-only viewer who
  // lacks role.view — breaking the read-only Users list they *are*
  // entitled to see.
  const permissions = currentUser?.permissions ?? [];
  const canCreate = permissions.includes("user.create");
  const canEdit = permissions.includes("user.edit");
  const canDisable = permissions.includes("user.disable");
  const canViewRoles = permissions.includes("role.view");
  const canViewCampuses = permissions.includes("campus.view");
  const canAssignRoles = canEdit && canViewRoles && canViewCampuses;
  const canAct = canEdit || canDisable;

  const [roles, campuses] = await Promise.all([
    canViewRoles ? apiRequest<RoleOption[]>("/api/v1/roles") : Promise.resolve<RoleOption[]>([]),
    canViewCampuses ? apiRequest<CampusOption[]>("/api/v1/campuses") : Promise.resolve<CampusOption[]>([]),
  ]);

  const activeRoles = roles.filter((r) => !r.archivedAt);
  const campusName = (id: string | null) =>
    id ? (campuses.find((c) => c.id === id)?.name ?? (canViewCampuses ? "Unknown campus" : "Other campus")) : "All campuses";

  return (
    <div>
      <PageHeader
        title="Users"
        description="Login accounts and the roles (Campus Head, Incharge, Office, Teacher, ...) each one holds. A Teacher login here still needs a Teacher profile — see the Teachers page — before they show up in academic modules."
        action={canCreate ? <CreateUserDialog /> : undefined}
      />

      {users.length === 0 ? (
        <p className="text-sm text-muted-foreground">No users yet. Click &quot;Add user&quot; to create one.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Roles</TableHead>
                {canAct ? <TableHead className="text-right">Actions</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.fullName}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    {user.isActive ? <Badge>Active</Badge> : <Badge variant="secondary">Disabled</Badge>}
                  </TableCell>
                  <TableCell>
                    {user.roles.length === 0 ? (
                      <span className="text-sm text-muted-foreground">No roles</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {user.roles.map((role) => (
                          <div key={role.userRoleId} className="flex items-center gap-1">
                            <Badge variant="outline" title={campusName(role.campusId)}>
                              {role.roleName}
                              {role.campusId ? ` · ${campusName(role.campusId)}` : ""}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  {canAct ? (
                    <TableCell className="flex flex-wrap justify-end gap-2">
                      {canAssignRoles ? (
                        <AssignRoleDialog userId={user.id} userName={user.fullName} roles={activeRoles} campuses={campuses} />
                      ) : null}
                      {canEdit
                        ? user.roles.map((role) => (
                            <RemoveRoleButton
                              key={role.userRoleId}
                              userId={user.id}
                              userRoleId={role.userRoleId}
                              roleName={`${role.roleName}${role.campusId ? ` (${campusName(role.campusId)})` : ""}`}
                            />
                          ))
                        : null}
                      {canDisable ? <ToggleActiveButton userId={user.id} isActive={user.isActive} /> : null}
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
