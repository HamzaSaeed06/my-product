import { apiRequest } from "@/lib/apiClient";
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
  const [users, roles, campuses] = await Promise.all([
    apiRequest<UserRow[]>("/api/v1/users"),
    apiRequest<RoleOption[]>("/api/v1/roles"),
    apiRequest<CampusOption[]>("/api/v1/campuses"),
  ]);

  const activeRoles = roles.filter((r) => !r.archivedAt);
  const campusName = (id: string | null) => (id ? campuses.find((c) => c.id === id)?.name ?? "Unknown campus" : "All campuses");

  return (
    <div>
      <PageHeader
        title="Users"
        description="Login accounts and the roles (Principal, Incharge, Office, Teacher, ...) each one holds. A Teacher login here still needs a Teacher profile — see the Teachers page — before they show up in academic modules."
        action={<CreateUserDialog />}
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
                <TableHead className="text-right">Actions</TableHead>
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
                  <TableCell className="flex flex-wrap justify-end gap-2">
                    <AssignRoleDialog userId={user.id} userName={user.fullName} roles={activeRoles} campuses={campuses} />
                    {user.roles.map((role) => (
                      <RemoveRoleButton
                        key={role.userRoleId}
                        userId={user.id}
                        userRoleId={role.userRoleId}
                        roleName={`${role.roleName}${role.campusId ? ` (${campusName(role.campusId)})` : ""}`}
                      />
                    ))}
                    <ToggleActiveButton userId={user.id} isActive={user.isActive} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
