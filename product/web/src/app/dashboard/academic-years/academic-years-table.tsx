"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { EditAcademicYearDialog } from "./academic-year-dialogs";
import { CloseYearButton } from "./close-year-button";

interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "CLOSED";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// Client wrapper for the Server/Client boundary reason documented in
// DESIGN.md — the page fetches, this owns the DataTable column defs.
export function AcademicYearsTable({
  years,
  canEdit,
  canClose,
}: {
  years: AcademicYear[];
  canEdit: boolean;
  canClose: boolean;
}) {
  const columns: DataTableColumn<AcademicYear>[] = [
    {
      key: "name",
      header: "Name",
      sortValue: (y) => y.name,
      render: (y) => <span className="font-medium">{y.name}</span>,
    },
    {
      key: "startDate",
      header: "Start",
      sortValue: (y) => y.startDate,
      render: (y) => <span className="text-muted-foreground">{formatDate(y.startDate)}</span>,
    },
    {
      key: "endDate",
      header: "End",
      sortValue: (y) => y.endDate,
      render: (y) => <span className="text-muted-foreground">{formatDate(y.endDate)}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortValue: (y) => y.status,
      render: (y) => (y.status === "CLOSED" ? <Badge variant="secondary">Closed</Badge> : <Badge>Active</Badge>),
    },
  ];

  if (canEdit || canClose) {
    columns.push({
      key: "actions",
      header: "Actions",
      align: "right",
      render: (y) =>
        y.status === "ACTIVE" ? (
          <div className="flex justify-end gap-2">
            {canEdit ? <EditAcademicYearDialog year={y} /> : null}
            {canClose ? <CloseYearButton id={y.id} name={y.name} /> : null}
          </div>
        ) : null,
    });
  }

  return (
    <DataTable
      columns={columns}
      data={years}
      getRowKey={(y) => y.id}
      searchPlaceholder="Search academic years..."
      searchText={(y) => y.name}
      emptyMessage='No academic years yet. Click "Add academic year" to create one.'
    />
  );
}
