"use client";

import { Building2, GraduationCap, Layers, ShieldCheck, Wallet } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatCard } from "@/components/stat-card";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { SectionsTable } from "@/app/dashboard/sections/sections-table";
import { CreateSectionDialog } from "@/app/dashboard/sections/section-dialogs";
import { FeeStructuresTable } from "@/app/dashboard/fee-structures/fee-structures-table";
import { CreateStructureDialog } from "@/app/dashboard/fee-structures/structure-dialog";
import { InchargeScopesTable } from "@/app/dashboard/incharge-scopes/incharge-scopes-table";
import { CreateInchargeScopeDialog } from "@/app/dashboard/incharge-scopes/scope-dialogs";

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

interface Teacher {
  id: string;
  employeeCode: string | null;
  qualification: string | null;
  phone: string | null;
  status: "ACTIVE" | "ARCHIVED";
  user: { id: string; fullName: string; email: string };
}

// Client wrapper for the Server/Client boundary reason documented in
// DESIGN.md — the page fetches everything (permission checks + all five
// tabs' data eagerly, cheap for a single campus), this owns the Tabs
// chrome plus every table's function-shaped column defs (SectionsTable /
// FeeStructuresTable / InchargeScopesTable already are their own client
// wrappers for the same reason; the Staff tab's read-only columns are
// small enough to build inline here rather than a dedicated file).
export function CampusHubTabs({
  campus,
  classes,
  classNameById,
  campusNameById,
  academicYears,
  yearNameById,
  sections,
  feeStructures,
  feeCategories,
  instituteId,
  scopes,
  userNameById,
  inchargeUsers,
  teachers,
  canViewSections,
  canCreateSection,
  canEditSection,
  canArchiveSection,
  canViewFeeStructures,
  canCreateFeeStructure,
  canEditFeeStructure,
  canViewScopes,
  canCreateScope,
  canEditScope,
  canRevokeScope,
  canViewTeachers,
}: {
  campus: Campus;
  classes: NamedOption[];
  classNameById: Record<string, string>;
  campusNameById: Record<string, string>;
  academicYears: NamedOption[];
  yearNameById: Record<string, string>;
  sections: Section[];
  feeStructures: FeeStructure[];
  feeCategories: FeeCategory[];
  instituteId: string | null;
  scopes: Scope[];
  userNameById: Record<string, string>;
  inchargeUsers: (NamedOption & { email: string })[];
  teachers: Teacher[];
  canViewSections: boolean;
  canCreateSection: boolean;
  canEditSection: boolean;
  canArchiveSection: boolean;
  canViewFeeStructures: boolean;
  canCreateFeeStructure: boolean;
  canEditFeeStructure: boolean;
  canViewScopes: boolean;
  canCreateScope: boolean;
  canEditScope: boolean;
  canRevokeScope: boolean;
  canViewTeachers: boolean;
}) {
  const singleCampusList = [{ id: campus.id, name: campus.name }];

  const teacherColumns: DataTableColumn<Teacher>[] = [
    {
      key: "name",
      header: "Name",
      sortValue: (t) => t.user.fullName,
      render: (t) => <span className="font-medium">{t.user.fullName}</span>,
    },
    {
      key: "employeeCode",
      header: "Employee code",
      sortValue: (t) => t.employeeCode ?? "",
      render: (t) => <span className="text-muted-foreground">{t.employeeCode ?? "—"}</span>,
    },
    {
      key: "qualification",
      header: "Qualification",
      sortValue: (t) => t.qualification ?? "",
      render: (t) => <span className="text-muted-foreground">{t.qualification ?? "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortValue: (t) => t.status,
      render: (t) => (t.status === "ARCHIVED" ? <Badge variant="secondary">Archived</Badge> : <Badge>Active</Badge>),
    },
  ];

  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="staff">Staff</TabsTrigger>
        <TabsTrigger value="sections">Sections</TabsTrigger>
        <TabsTrigger value="fee-structures">Fee structures</TabsTrigger>
        <TabsTrigger value="incharge-scopes">Incharge scopes</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-4">
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Sections" value={sections.length} icon={Layers} />
          <StatCard label="Fee structures" value={feeStructures.length} icon={Wallet} />
          <StatCard label="Incharge scopes" value={scopes.length} icon={ShieldCheck} />
          <StatCard label="Teachers" value={teachers.length} icon={GraduationCap} />
        </div>
        <div className="rounded-lg border border-border p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Building2 className="size-4" />
            Campus details
          </div>
          <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Name</dt>
              <dd className="text-foreground">{campus.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Address</dt>
              <dd className="text-foreground">{campus.address ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="text-foreground">{campus.phone ?? "—"}</dd>
            </div>
          </dl>
        </div>
      </TabsContent>

      <TabsContent value="staff" className="mt-4">
        {canViewTeachers ? (
          <DataTable
            columns={teacherColumns}
            data={teachers}
            getRowKey={(t) => t.id}
            searchPlaceholder="Search teachers..."
            searchText={(t) => `${t.user.fullName} ${t.employeeCode ?? ""} ${t.qualification ?? ""}`}
            emptyMessage="No teachers at this campus yet."
          />
        ) : (
          <NoPermission resource="teachers" />
        )}
      </TabsContent>

      <TabsContent value="sections" className="mt-4">
        {canViewSections ? (
          <div className="flex flex-col gap-3">
            {canCreateSection ? (
              <div className="flex justify-end">
                <CreateSectionDialog classes={classes} campuses={singleCampusList} academicYears={academicYears} />
              </div>
            ) : null}
            <SectionsTable
              sections={sections}
              classNameById={classNameById}
              campusNameById={campusNameById}
              yearNameById={yearNameById}
              canEdit={canEditSection}
              canArchive={canArchiveSection}
            />
          </div>
        ) : (
          <NoPermission resource="sections" />
        )}
      </TabsContent>

      <TabsContent value="fee-structures" className="mt-4">
        {canViewFeeStructures ? (
          <div className="flex flex-col gap-3">
            {canCreateFeeStructure && instituteId ? (
              <div className="flex justify-end">
                <CreateStructureDialog instituteId={instituteId} classes={classes} categories={feeCategories} />
              </div>
            ) : null}
            <FeeStructuresTable structures={feeStructures} canEdit={canEditFeeStructure} />
          </div>
        ) : (
          <NoPermission resource="fee structures" />
        )}
      </TabsContent>

      <TabsContent value="incharge-scopes" className="mt-4">
        {canViewScopes ? (
          <div className="flex flex-col gap-3">
            {canCreateScope ? (
              <div className="flex justify-end">
                <CreateInchargeScopeDialog
                  inchargeUsers={inchargeUsers}
                  campuses={singleCampusList}
                  academicYears={academicYears}
                  classes={classes}
                />
              </div>
            ) : null}
            <InchargeScopesTable
              scopes={scopes}
              userNameById={userNameById}
              campusNameById={campusNameById}
              yearNameById={yearNameById}
              classNameById={classNameById}
              classes={classes}
              sections={sections}
              canCreate={canCreateScope}
              canEdit={canEditScope}
              canRevoke={canRevokeScope}
            />
          </div>
        ) : (
          <NoPermission resource="incharge scopes" />
        )}
      </TabsContent>
    </Tabs>
  );
}

function NoPermission({ resource }: { resource: string }) {
  return <p className="text-sm text-muted-foreground">You don&apos;t have permission to view {resource}.</p>;
}
