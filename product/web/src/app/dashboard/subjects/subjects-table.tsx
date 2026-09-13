"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { EditSubjectDialog } from "./subject-dialogs";
import { ArchiveSubjectButton } from "./archive-subject-button";

interface Subject {
  id: string;
  name: string;
  code: string | null;
  archivedAt: string | null;
}

// Client wrapper for the Server/Client boundary reason documented in
// DESIGN.md — the page fetches, this owns the DataTable column defs.
export function SubjectsTable({
  subjects,
  canEdit,
  canArchive,
}: {
  subjects: Subject[];
  canEdit: boolean;
  canArchive: boolean;
}) {
  const columns: DataTableColumn<Subject>[] = [
    {
      key: "name",
      header: "Name",
      sortValue: (s) => s.name,
      render: (s) => <span className="font-medium">{s.name}</span>,
    },
    {
      key: "code",
      header: "Code",
      sortValue: (s) => s.code ?? "",
      render: (s) => <span className="text-muted-foreground">{s.code ?? "—"}</span>,
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
            {canEdit ? <EditSubjectDialog subject={s} /> : null}
            {canArchive ? <ArchiveSubjectButton id={s.id} name={s.name} /> : null}
          </div>
        ) : null,
    });
  }

  return (
    <DataTable
      columns={columns}
      data={subjects}
      getRowKey={(s) => s.id}
      searchPlaceholder="Search subjects..."
      searchText={(s) => `${s.name} ${s.code ?? ""}`}
      emptyMessage='No subjects yet. Click "Add subject" to create one.'
    />
  );
}
