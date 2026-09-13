"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { ArchiveCategoryButton, ArchiveStructureButton } from "./archive-buttons";

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

// Client wrapper for the Server/Client boundary reason documented in
// DESIGN.md — extracted out of fee-structures/page.tsx (and reused,
// pre-filtered by campusId, by the campus hub page's Fee structures tab)
// so the render/sortValue closures aren't passed as props across the
// server/client boundary. Categories are a simple chip list (no sorting/
// searching needed for a handful of categories), so only the structures
// list uses the shared DataTable primitive, matching invoices-table.tsx's
// reference shape.
export function FeeCategoriesList({
  categories,
  canEdit,
}: {
  categories: FeeCategory[];
  canEdit: boolean;
}) {
  if (categories.length === 0) {
    return <p className="text-sm text-muted-foreground">No fee categories yet.</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((c) => (
        <div key={c.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm">
          {c.name}
          {canEdit ? <ArchiveCategoryButton id={c.id} /> : null}
        </div>
      ))}
    </div>
  );
}

export function FeeStructuresTable({
  structures,
  canEdit,
}: {
  structures: FeeStructure[];
  canEdit: boolean;
}) {
  const columns: DataTableColumn<FeeStructure>[] = [
    {
      key: "name",
      header: "Name",
      sortValue: (s) => s.name,
      render: (s) => <span className="font-medium">{s.name}</span>,
    },
    {
      key: "class",
      header: "Class",
      sortValue: (s) => s.klass.name,
      render: (s) => <span className="text-muted-foreground">{s.klass.name}</span>,
    },
    {
      key: "category",
      header: "Category",
      sortValue: (s) => s.feeCategory.name,
      render: (s) => <span className="text-muted-foreground">{s.feeCategory.name}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      sortValue: (s) => Number(s.amount),
      render: (s) => <span className="tabular-nums text-muted-foreground">{s.amount}</span>,
    },
    {
      key: "frequency",
      header: "Frequency",
      sortValue: (s) => s.frequency,
      render: (s) => <Badge variant="secondary">{s.frequency}</Badge>,
    },
  ];

  if (canEdit) {
    columns.push({
      key: "actions",
      header: "Actions",
      align: "right",
      render: (s) => (
        <div className="flex justify-end">
          <ArchiveStructureButton id={s.id} />
        </div>
      ),
    });
  }

  return (
    <DataTable
      columns={columns}
      data={structures}
      getRowKey={(s) => s.id}
      searchPlaceholder="Search fee structures..."
      searchText={(s) => `${s.name} ${s.klass.name} ${s.feeCategory.name}`}
      emptyMessage="No fee structures yet."
    />
  );
}
