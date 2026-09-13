"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { EditInchargeScopeDialog } from "./scope-dialogs";
import { RevokeScopeButton } from "./revoke-scope-button";

interface NamedOption {
  id: string;
  name: string;
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

// Client wrapper for the Server/Client boundary reason documented in
// DESIGN.md — extracted out of incharge-scopes/page.tsx (and reused,
// pre-filtered by campusId, by the campus hub page's Incharge scopes tab)
// so the render/sortValue closures aren't passed as props across the
// server/client boundary. Lookup maps cross as plain Record<string, string>
// objects, same convention as sections-table.tsx / invoices-table.tsx.
export function InchargeScopesTable({
  scopes,
  userNameById,
  campusNameById,
  yearNameById,
  classNameById,
  classes,
  sections,
  canCreate,
  canEdit,
  canRevoke,
}: {
  scopes: Scope[];
  userNameById: Record<string, string>;
  campusNameById: Record<string, string>;
  yearNameById: Record<string, string>;
  classNameById: Record<string, string>;
  classes: NamedOption[];
  sections: NamedOption[];
  canCreate: boolean;
  canEdit: boolean;
  canRevoke: boolean;
}) {
  const columns: DataTableColumn<Scope>[] = [
    {
      key: "incharge",
      header: "Incharge",
      sortValue: (s) => userNameById[s.userId] ?? "",
      render: (s) => <span className="font-medium">{userNameById[s.userId] ?? "—"}</span>,
    },
    {
      key: "campus",
      header: "Campus",
      sortValue: (s) => campusNameById[s.campusId] ?? "",
      render: (s) => <span className="text-muted-foreground">{campusNameById[s.campusId] ?? "—"}</span>,
    },
    {
      key: "academicYear",
      header: "Academic year",
      sortValue: (s) => yearNameById[s.academicYearId] ?? "",
      render: (s) => <span className="text-muted-foreground">{yearNameById[s.academicYearId] ?? "—"}</span>,
    },
    {
      key: "classes",
      header: "Classes",
      render: (s) => (
        <div className="flex flex-wrap gap-1">
          {s.classes.map((c) => (
            <Badge key={c.classId} variant="secondary">
              {classNameById[c.classId] ?? "—"}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "sections",
      header: "Sections",
      sortValue: (s) => s.sections.length,
      render: (s) => (
        <span className="text-muted-foreground">{s.sections.length === 0 ? "All sections" : s.sections.length}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (s) => (
        <div className="flex justify-end gap-2">
          {canEdit ? <EditInchargeScopeDialog scope={s} classes={classes} sections={sections} /> : null}
          {canRevoke ? <RevokeScopeButton id={s.id} userName={userNameById[s.userId] ?? "this user"} /> : null}
          {!canEdit && !canRevoke ? <span className="text-xs text-muted-foreground">View only</span> : null}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={scopes}
      getRowKey={(s) => s.id}
      searchPlaceholder="Search incharge scopes..."
      searchText={(s) =>
        `${userNameById[s.userId] ?? ""} ${campusNameById[s.campusId] ?? ""} ${yearNameById[s.academicYearId] ?? ""}`
      }
      emptyMessage={
        canCreate
          ? 'No scopes assigned yet. Click "Assign scope" to give an Incharge access to classes/sections.'
          : "No Incharge scopes at your campus yet."
      }
    />
  );
}
