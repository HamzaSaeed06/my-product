"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { EditCampusDialog } from "./campus-dialogs";
import { ArchiveCampusButton } from "./archive-campus-button";

interface Campus {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  archivedAt: string | null;
}

// Client wrapper for the Server/Client boundary reason documented in
// DESIGN.md — the page fetches, this owns the DataTable column defs
// (render closures aren't serializable as props from the Server Component).
export function CampusesTable({
  campuses,
  canEdit,
  canArchive,
}: {
  campuses: Campus[];
  canEdit: boolean;
  canArchive: boolean;
}) {
  const columns: DataTableColumn<Campus>[] = [
    {
      key: "name",
      header: "Name",
      sortValue: (c) => c.name,
      render: (c) => (
        <Link href={`/dashboard/campuses/${c.id}`} className="font-medium hover:underline">
          {c.name}
        </Link>
      ),
    },
    {
      key: "address",
      header: "Address",
      sortValue: (c) => c.address ?? "",
      render: (c) => <span className="text-muted-foreground">{c.address ?? "—"}</span>,
    },
    {
      key: "phone",
      header: "Phone",
      render: (c) => <span className="text-muted-foreground">{c.phone ?? "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortValue: (c) => (c.archivedAt ? "Archived" : "Active"),
      render: (c) => (c.archivedAt ? <Badge variant="secondary">Archived</Badge> : <Badge>Active</Badge>),
    },
  ];

  if (canEdit || canArchive) {
    columns.push({
      key: "actions",
      header: "Actions",
      align: "right",
      render: (c) =>
        !c.archivedAt ? (
          <div className="flex justify-end gap-2">
            {canEdit ? <EditCampusDialog campus={c} /> : null}
            {canArchive ? <ArchiveCampusButton id={c.id} name={c.name} /> : null}
          </div>
        ) : null,
    });
  }

  return (
    <DataTable
      columns={columns}
      data={campuses}
      getRowKey={(c) => c.id}
      searchPlaceholder="Search campuses..."
      searchText={(c) => `${c.name} ${c.address ?? ""} ${c.phone ?? ""}`}
      emptyMessage='No campuses yet. Click "Add campus" to create one.'
    />
  );
}
