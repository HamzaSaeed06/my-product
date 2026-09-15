import type { Viewer } from "./session";
import { mockRoles, type RoleDef } from "./roles";
import { mockRolePermissions } from "./role-permissions";
import { mockCampuses } from "./campuses";

// Kept out of session.ts to avoid a cycle: role-permissions.ts already
// imports ALL_PERMISSIONS from session.ts.

export const DEFAULT_ROLE_ID = "role_super_admin";

// Parent and Student sign into /portal, a separate shell this dashboard
// role-switcher doesn't cover — only the roles that actually land on
// /dashboard are offered here.
export const DASHBOARD_ROLES: RoleDef[] = mockRoles.filter(
  (r) => r.systemKey !== "PARENT" && r.systemKey !== "STUDENT" && !r.archivedAt
);

// One demo identity per role, purely so switching roles feels like signing
// in as a different real person rather than relabeling the same one.
const DEMO_IDENTITY: Record<string, { fullName: string; email: string }> = {
  role_super_admin: { fullName: "Ayesha Raza", email: "ayesha.raza@risecampus.edu" },
  role_campus_head: { fullName: "Kamran Yousuf", email: "kamran.yousuf@risecampus.edu" },
  role_incharge: { fullName: "Sana Tariq", email: "sana.tariq@risecampus.edu" },
  role_office: { fullName: "Mehak Aslam", email: "mehak.aslam@risecampus.edu" },
  role_teacher: { fullName: "Bilal Chaudhry", email: "bilal.chaudhry@risecampus.edu" },
  role_exam_coordinator: { fullName: "Nida Farooq", email: "nida.farooq@risecampus.edu" },
};

// Resolves whatever the cookie holds (missing, stale, or an archived/
// removed role id) down to a real roleId, so callers never have to
// separately guard against a bad cookie value.
export function resolveRoleId(rawRoleId: string | undefined): string {
  return DASHBOARD_ROLES.some((r) => r.id === rawRoleId) ? rawRoleId! : DEFAULT_ROLE_ID;
}

export function getViewerForRole(roleId: string): Viewer {
  const role = DASHBOARD_ROLES.find((r) => r.id === roleId) ?? DASHBOARD_ROLES.find((r) => r.id === DEFAULT_ROLE_ID)!;
  const identity = DEMO_IDENTITY[role.id];
  const permissions = mockRolePermissions.filter((g) => g.roleId === role.id).map((g) => g.permission);
  const campus = mockCampuses[0];

  return {
    id: `usr_demo_${role.id}`,
    fullName: identity.fullName,
    email: identity.email,
    roles: [role.systemKey ?? role.id],
    permissions,
    scope: role.requiresCampus ? { campusId: campus.id, campusName: campus.name } : undefined,
  };
}
