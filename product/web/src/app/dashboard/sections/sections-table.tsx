"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { EditSectionDialog } from "./section-dialogs";
import { ArchiveSectionButton } from "./archive-section-button";

interface Section {
  id: string;
  name: string;
  classId: string;
  campusId: string;
  academicYearId: string;
  capacity: number | null;
  archivedAt: string | null;
}

// Client wrapper for the Server/Client boundary reason documented in
// DESIGN.md — the page fetches (and resolves permissions + lookup maps),
// this owns the DataTable column defs. Lookup maps cross the boundary as
// plain Record<string, string> objects (Map isn't serializable as a prop),
// same convention as invoices-table.tsx's studentNameById.
export function SectionsTable({
  sections,
  classNameById,
  campusNameById,
  yearNameById,
  canEdit,
  canArchive,
}: {
  sections: Section[];
  classNameById: Record<string, string>;
  campusNameById: Record<string, string>;
  yearNameById: Record<string, string>;
  canEdit: boolean;
  canArchive: boolean;
}) {
  const columns: DataTableColumn<Section>[] = [
    {
      key: "name",
      header: "Section",
      sortValue: (s) => s.name,
      render: (s) => <span className="font-medium">{s.name}</span>,
    },
    {
      key: "class",
      header: "Class",
      sortValue: (s) => classNameById[s.classId] ?? "",
      render: (s) => <span className="text-muted-foreground">{classNameById[s.classId] ?? "—"}</span>,
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
      key: "capacity",
      header: "Capacity",
      sortValue: (s) => s.capacity ?? 0,
      render: (s) => <span className="text-muted-foreground">{s.capacity ?? "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortValue: (s) => (s.archivedAt ? "Archived" : "Active"),
      render: (s) => (s.archivedAt ? <Badge variant="secondary">Archived</Badge> : <Badge>Active</Badge>),
    },
  ];

  if (canEdit || canArchive) {
    columns.push({
      key: "actions",
      header: "Actions",
      align: "right",
      render: (s) =>
        !s.archivedAt ? (
          <div className="flex justify-end gap-2">
            {canEdit ? <EditSectionDialog section={s} /> : null}
            {canArchive ? <ArchiveSectionButton id={s.id} name={s.name} /> : null}
          </div>
        ) : null,
    });
  }

  return (
    <DataTable
      columns={columns}
      data={sections}
      getRowKey={(s) => s.id}
      searchPlaceholder="Search sections..."
      searchText={(s) =>
        `${s.name} ${classNameById[s.classId] ?? ""} ${campusNameById[s.campusId] ?? ""} ${yearNameById[s.academicYearId] ?? ""}`
      }
      emptyMessage='No sections yet. Click "Add section" to create one.'
    />
  );
}
