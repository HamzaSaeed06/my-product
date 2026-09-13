import { notFound } from "next/navigation";
import { apiRequest } from "@/lib/apiClient";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { CampusHubTabs } from "./campus-hub-tabs";

interface Campus {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  archivedAt: string | null;
}

interface NamedOption {
  id: string;
  name: string;
}

interface Section {
  id: string;
  name: string;
  classId: string;
  campusId: string;
  academicYearId: string;
  capacity: number | null;
  archivedAt: string | null;
}

interface FeeCategory {
  id: string;
  name: string;
  archivedAt: string | null;
}

interface FeeStructure {
  id: string;
  name: string;
  amount: string;
  frequency: string;
  klass: { name: string };
  feeCategory: { name: string };
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

interface UserWithRoles {
  id: string;
  fullName: string;
  email: string;
  roles: { roleName: string }[];
}

interface Teacher {
  id: string;
  employeeCode: string | null;
  qualification: string | null;
  phone: string | null;
  status: "ACTIVE" | "ARCHIVED";
  user: { id: string; fullName: string; email: string };
}

interface Institute {
  id: string;
}

// Super Admin's single-campus hub (Phase 11 Section 3) — replaces the
// "assigning an Incharge / adding a fee structure / checking a campus's
// sections each require a different top-level nav item, manually filtered"
// workflow with one page. Every tab reuses the SAME list component / dialogs
// / server actions the corresponding top-level page uses (SectionsTable,
// FeeStructuresTable, InchargeScopesTable, and their create dialogs), just
// pre-filtered to this campus — no duplicated list/table code, no backend
// changes (GET /sections, /fee-structures, /incharge-scopes, /teachers all
// already accept ?campusId=, verified by reading each controller).
//
// There is no GET /campuses/:id — the full list is small (a handful of
// campuses per institute), so we fetch it and find the match, same as the
// research for this task established.
export default async function CampusHubPage({
  params,
}: {
  params: Promise<{ campusId: string }>;
}) {
  const { campusId } = await params;

  const currentUser = await getCurrentUser();
  const permissions = currentUser?.permissions ?? [];

  // Each tab's own .view permission gates its primary fetch (this page
  // combines four independently-permissioned resources on one screen,
  // unlike any single top-level list page, so a viewer missing one of
  // these — e.g. incharge_scope.view — must not crash the whole hub, just
  // show that one tab as unavailable). Create/edit/archive/revoke mirror
  // the exact keys already gated on each resource's own top-level page.
  const canViewSections = permissions.includes("section.view");
  const canCreateSection = permissions.includes("section.create");
  const canEditSection = permissions.includes("section.edit");
  const canArchiveSection = permissions.includes("section.archive");

  const canViewFeeStructures = permissions.includes("fee_structure.view");
  const canCreateFeeStructure = permissions.includes("fee_structure.create");
  const canEditFeeStructure = permissions.includes("fee_structure.edit");

  const canViewScopes = permissions.includes("incharge_scope.view");
  const canCreateScope = permissions.includes("incharge_scope.create");
  const canEditScope = permissions.includes("incharge_scope.edit");
  const canRevokeScope = permissions.includes("incharge_scope.revoke");

  const canViewTeachers = permissions.includes("teacher.view");

  const [campuses, classes, academicYears, users, sections, feeStructures, scopes, teachers, institute, categories] =
    await Promise.all([
      apiRequest<Campus[]>("/api/v1/campuses"),
      apiRequest<NamedOption[]>("/api/v1/classes"),
      apiRequest<NamedOption[]>("/api/v1/academic-years"),
      apiRequest<UserWithRoles[]>("/api/v1/users"),
      canViewSections
        ? apiRequest<Section[]>(`/api/v1/sections?campusId=${campusId}`)
        : Promise.resolve<Section[]>([]),
      canViewFeeStructures
        ? apiRequest<FeeStructure[]>(`/api/v1/fee-structures?campusId=${campusId}`)
        : Promise.resolve<FeeStructure[]>([]),
      canViewScopes
        ? apiRequest<Scope[]>(`/api/v1/incharge-scopes?campusId=${campusId}`)
        : Promise.resolve<Scope[]>([]),
      canViewTeachers
        ? apiRequest<Teacher[]>(`/api/v1/teachers?campusId=${campusId}`)
        : Promise.resolve<Teacher[]>([]),
      canCreateFeeStructure ? apiRequest<Institute>("/api/v1/institute") : Promise.resolve<Institute | null>(null),
      canCreateFeeStructure ? apiRequest<FeeCategory[]>("/api/v1/fee-categories") : Promise.resolve<FeeCategory[]>([]),
    ]);

  const campus = campuses.find((c) => c.id === campusId);
  if (!campus) notFound();

  const classNameById = Object.fromEntries(classes.map((c) => [c.id, c.name]));
  const yearNameById = Object.fromEntries(academicYears.map((y) => [y.id, y.name]));
  // Every row in `sections`/`feeStructures`/`scopes` is already filtered to
  // this one campus (via ?campusId=), so a single-entry map is all any
  // table's campus-name column needs — no extra institute-wide
  // /api/v1/campuses re-fetch or campus.view re-check required.
  const campusNameById = { [campus.id]: campus.name };
  const userNameById = Object.fromEntries(users.map((u) => [u.id, u.fullName]));

  const inchargeUsers = users
    .filter((u) => u.roles.some((r) => r.roleName === "INCHARGE"))
    .map((u) => ({ id: u.id, name: u.fullName, email: u.email }));

  return (
    <div>
      <PageHeader
        title={campus.name}
        description={[campus.address, campus.phone].filter(Boolean).join(" · ") || "Campus hub"}
      />

      <CampusHubTabs
        campus={campus}
        classes={classes}
        classNameById={classNameById}
        campusNameById={campusNameById}
        academicYears={academicYears}
        yearNameById={yearNameById}
        sections={sections}
        feeStructures={feeStructures}
        feeCategories={categories}
        instituteId={institute?.id ?? null}
        scopes={scopes}
        userNameById={userNameById}
        inchargeUsers={inchargeUsers}
        teachers={teachers}
        canViewSections={canViewSections}
        canCreateSection={canCreateSection}
        canEditSection={canEditSection}
        canArchiveSection={canArchiveSection}
        canViewFeeStructures={canViewFeeStructures}
        canCreateFeeStructure={canCreateFeeStructure}
        canEditFeeStructure={canEditFeeStructure}
        canViewScopes={canViewScopes}
        canCreateScope={canCreateScope}
        canEditScope={canEditScope}
        canRevokeScope={canRevokeScope}
        canViewTeachers={canViewTeachers}
      />
    </div>
  );
}
