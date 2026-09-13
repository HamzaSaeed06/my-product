import { apiRequest } from "@/lib/apiClient";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { CreateUserDialog } from "./user-dialogs";
import { UsersTable } from "./users-table";

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

  const [roles, campuses] = await Promise.all([
    canViewRoles ? apiRequest<RoleOption[]>("/api/v1/roles") : Promise.resolve<RoleOption[]>([]),
    canViewCampuses ? apiRequest<CampusOption[]>("/api/v1/campuses") : Promise.resolve<CampusOption[]>([]),
  ]);

  const activeRoles = roles.filter((r) => !r.archivedAt);

  return (
    <div>
      <PageHeader
        title="Users"
        description="Login accounts and the roles (Campus Head, Incharge, Office, Teacher, ...) each one holds. A Teacher login here still needs a Teacher profile — see the Teachers page — before they show up in academic modules."
        action={canCreate ? <CreateUserDialog /> : undefined}
      />

      <UsersTable
        users={users}
        activeRoles={activeRoles}
        campuses={campuses}
        canViewCampuses={canViewCampuses}
        canEdit={canEdit}
        canDisable={canDisable}
        canAssignRoles={canAssignRoles}
      />
    </div>
  );
}
