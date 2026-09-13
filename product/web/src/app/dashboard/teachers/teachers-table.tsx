"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { EditTeacherDialog } from "./teacher-dialogs";
import { ArchiveTeacherButton } from "./archive-teacher-button";

interface Teacher {
  id: string;
  employeeCode: string | null;
  qualification: string | null;
  phone: string | null;
  status: "ACTIVE" | "ARCHIVED";
  user: { id: string; fullName: string; email: string };
}

// Client wrapper for the Server/Client boundary reason documented in
// DESIGN.md — the page fetches (and resolves permissions), this owns the
// DataTable column defs.
export function TeachersTable({
  teachers,
  canEdit,
  canArchive,
}: {
  teachers: Teacher[];
  canEdit: boolean;
  canArchive: boolean;
}) {
  const columns: DataTableColumn<Teacher>[] = [
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

  if (canEdit || canArchive) {
    columns.push({
      key: "actions",
      header: "Actions",
      align: "right",
      render: (t) =>
        t.status === "ACTIVE" ? (
          <div className="flex justify-end gap-2">
            {canEdit ? <EditTeacherDialog teacher={t} /> : null}
            {canArchive ? <ArchiveTeacherButton id={t.id} name={t.user.fullName} /> : null}
          </div>
        ) : null,
    });
  }

  return (
    <DataTable
      columns={columns}
      data={teachers}
      getRowKey={(t) => t.id}
      searchPlaceholder="Search teachers..."
      searchText={(t) => `${t.user.fullName} ${t.employeeCode ?? ""} ${t.qualification ?? ""}`}
      emptyMessage='No teachers yet. Click "Add teacher" to create a profile.'
    />
  );
}
