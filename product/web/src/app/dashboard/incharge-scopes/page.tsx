import { apiRequest } from "@/lib/apiClient";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { CreateInchargeScopeDialog } from "./scope-dialogs";
import { InchargeScopesTable } from "./incharge-scopes-table";

interface NamedOption {
  id: string;
  name: string;
}

interface UserWithRoles {
  id: string;
  fullName: string;
  email: string;
  roles: { roleName: string }[];
}

interface Scope {
  id: string;
  userId: string;
  campusId: string;
  academicYearId: string;
  version: number;
  revokedAt: string | null;
  classes: { classId: string }[];
  sections: { sectionId: string }[];
}

export default async function InchargeScopesPage() {
  const user = await getCurrentUser();
  // incharge_scope.create/.edit/.revoke from routes.ts — distinct keys,
  // not necessarily all held together, so gated separately rather than
  // collapsed into one role check. sections is fetched only to feed the
  // Edit dialog's section CheckboxList (not used for row labels), so it's
  // gated behind canEdit; users/campuses/academicYears/classes double as
  // row labels for every viewer (userNameById/campusNameById/etc.) so they
  // stay unconditional and fall back to "—" per the table's own pattern.
  const permissions = user?.permissions ?? [];
  const canCreate = permissions.includes("incharge_scope.create");
  const canEdit = permissions.includes("incharge_scope.edit");
  const canRevoke = permissions.includes("incharge_scope.revoke");

  const [scopes, users, campuses, academicYears, classes, sections] = await Promise.all([
    apiRequest<Scope[]>("/api/v1/incharge-scopes"),
    apiRequest<UserWithRoles[]>("/api/v1/users"),
    apiRequest<NamedOption[]>("/api/v1/campuses"),
    apiRequest<NamedOption[]>("/api/v1/academic-years"),
    apiRequest<NamedOption[]>("/api/v1/classes"),
    canEdit ? apiRequest<NamedOption[]>("/api/v1/sections") : Promise.resolve<NamedOption[]>([]),
  ]);

  const inchargeUsers = users
    .filter((u) => u.roles.some((r) => r.roleName === "INCHARGE"))
    .map((u) => ({ id: u.id, name: u.fullName, email: u.email }));

  const userNameById = new Map(users.map((u) => [u.id, u.fullName]));
  const campusNameById = new Map(campuses.map((c) => [c.id, c.name]));
  const yearNameById = new Map(academicYears.map((y) => [y.id, y.name]));
  const classNameById = new Map(classes.map((c) => [c.id, c.name]));

  return (
    <div>
      <PageHeader
        title="Incharge Scopes"
        description="Which classes/sections each Incharge can manage — dynamic, overlap allowed by design."
        action={
          canCreate ? (
            <CreateInchargeScopeDialog
              inchargeUsers={inchargeUsers}
              campuses={campuses}
              academicYears={academicYears}
              classes={classes}
            />
          ) : undefined
        }
      />

      <InchargeScopesTable
        scopes={scopes}
        userNameById={Object.fromEntries(userNameById)}
        campusNameById={Object.fromEntries(campusNameById)}
        yearNameById={Object.fromEntries(yearNameById)}
        classNameById={Object.fromEntries(classNameById)}
        classes={classes}
        sections={sections}
        canCreate={canCreate}
        canEdit={canEdit}
        canRevoke={canRevoke}
      />
    </div>
  );
}
