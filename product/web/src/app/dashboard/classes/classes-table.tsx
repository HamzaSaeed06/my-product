"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { EditClassDialog } from "./class-dialogs";
import { ArchiveClassButton } from "./archive-class-button";

interface Klass {
  id: string;
  name: string;
  sortOrder: number;
  archivedAt: string | null;
}

// Client wrapper for the Server/Client boundary reason documented in
// DESIGN.md — the page fetches, this owns the DataTable column defs.
export function ClassesTable({
  classes,
  canEdit,
  canArchive,
}: {
  classes: Klass[];
  canEdit: boolean;
  canArchive: boolean;
}) {
  const columns: DataTableColumn<Klass>[] = [
    {
      key: "name",
      header: "Name",
      sortValue: (k) => k.name,
      render: (k) => <span className="font-medium">{k.name}</span>,
    },
    {
      key: "sortOrder",
      header: "Sort order",
      sortValue: (k) => k.sortOrder,
      render: (k) => <span className="text-muted-foreground">{k.sortOrder}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortValue: (k) => (k.archivedAt ? "Archived" : "Active"),
      render: (k) => (k.archivedAt ? <Badge variant="secondary">Archived</Badge> : <Badge>Active</Badge>),
    },
  ];

  if (canEdit || canArchive) {
    columns.push({
      key: "actions",
      header: "Actions",
      align: "right",
      render: (k) =>
        !k.archivedAt ? (
          <div className="flex justify-end gap-2">
            {canEdit ? <EditClassDialog klass={k} /> : null}
            {canArchive ? <ArchiveClassButton id={k.id} name={k.name} /> : null}
          </div>
        ) : null,
    });
  }

  return (
    <DataTable
      columns={columns}
      data={classes}
      getRowKey={(k) => k.id}
      searchPlaceholder="Search classes..."
      searchText={(k) => k.name}
      emptyMessage='No classes yet. Click "Add class" to create one.'
    />
  );
}
