import { apiRequest } from "@/lib/apiClient";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreateInchargeScopeDialog, EditInchargeScopeDialog } from "./scope-dialogs";
import { RevokeScopeButton } from "./revoke-scope-button";

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
  const [user, scopes, users, campuses, academicYears, classes, sections] = await Promise.all([
    getCurrentUser(),
    apiRequest<Scope[]>("/api/v1/incharge-scopes"),
    apiRequest<UserWithRoles[]>("/api/v1/users"),
    apiRequest<NamedOption[]>("/api/v1/campuses"),
    apiRequest<NamedOption[]>("/api/v1/academic-years"),
    apiRequest<NamedOption[]>("/api/v1/classes"),
    apiRequest<NamedOption[]>("/api/v1/sections"),
  ]);

  // Campus Head can see this page (their own campus's Incharge scopes) but
  // only Super Admin can create/edit/revoke one — matches the seed.ts
  // grant (CAMPUS_HEAD has incharge_scope.view only). A hidden button isn't
  // the real security boundary (the backend already refuses these actions
  // for CAMPUS_HEAD), but showing controls that would just 403 on click is
  // bad UX, so hide them here too.
  const canManage = !!user?.roles.includes("SUPER_ADMIN");

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
          canManage ? (
            <CreateInchargeScopeDialog
              inchargeUsers={inchargeUsers}
              campuses={campuses}
              academicYears={academicYears}
              classes={classes}
            />
          ) : undefined
        }
      />

      {scopes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {canManage
            ? 'No scopes assigned yet. Click "Assign scope" to give an Incharge access to classes/sections.'
            : "No Incharge scopes at your campus yet."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Incharge</TableHead>
                <TableHead>Campus</TableHead>
                <TableHead>Academic year</TableHead>
                <TableHead>Classes</TableHead>
                <TableHead>Sections</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scopes.map((scope) => (
                <TableRow key={scope.id}>
                  <TableCell className="font-medium">{userNameById.get(scope.userId) ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {campusNameById.get(scope.campusId) ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {yearNameById.get(scope.academicYearId) ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {scope.classes.map((c) => (
                        <Badge key={c.classId} variant="secondary">
                          {classNameById.get(c.classId) ?? "—"}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {scope.sections.length === 0 ? "All sections" : scope.sections.length}
                  </TableCell>
                  <TableCell className="flex justify-end gap-2">
                    {canManage ? (
                      <>
                        <EditInchargeScopeDialog scope={scope} classes={classes} sections={sections} />
                        <RevokeScopeButton id={scope.id} userName={userNameById.get(scope.userId) ?? "this user"} />
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">View only</span>
                    )}
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
