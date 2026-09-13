"use client";

import { DataTable, type DataTableColumn } from "@/components/data-table";
import { ArchiveAssignmentButton } from "./archive-assignment-button";

interface Assignment {
  id: string;
  teacher: { user: { fullName: string } };
  subject: { name: string };
  klass: { name: string };
  section: { name: string };
  academicYear: { name: string };
}

// Client wrapper for the Server/Client boundary reason documented in
// DESIGN.md — the page fetches, this owns the DataTable column defs.
export function TeacherAssignmentsTable({
  assignments,
  canEdit,
}: {
  assignments: Assignment[];
  canEdit: boolean;
}) {
  const columns: DataTableColumn<Assignment>[] = [
    {
      key: "teacher",
      header: "Teacher",
      sortValue: (a) => a.teacher.user.fullName,
      render: (a) => <span className="font-medium">{a.teacher.user.fullName}</span>,
    },
    {
      key: "subject",
      header: "Subject",
      sortValue: (a) => a.subject.name,
      render: (a) => <span className="text-muted-foreground">{a.subject.name}</span>,
    },
    {
      key: "class",
      header: "Class",
      sortValue: (a) => a.klass.name,
      render: (a) => <span className="text-muted-foreground">{a.klass.name}</span>,
    },
    {
      key: "section",
      header: "Section",
      render: (a) => <span className="text-muted-foreground">{a.section.name}</span>,
    },
    {
      key: "academicYear",
      header: "Academic year",
      sortValue: (a) => a.academicYear.name,
      render: (a) => <span className="text-muted-foreground">{a.academicYear.name}</span>,
    },
  ];

  if (canEdit) {
    columns.push({
      key: "actions",
      header: "Actions",
      align: "right",
      render: (a) => (
        <div className="flex justify-end">
          <ArchiveAssignmentButton id={a.id} />
        </div>
      ),
    });
  }

  return (
    <DataTable
      columns={columns}
      data={assignments}
      getRowKey={(a) => a.id}
      searchPlaceholder="Search assignments..."
      searchText={(a) =>
        `${a.teacher.user.fullName} ${a.subject.name} ${a.klass.name} ${a.section.name} ${a.academicYear.name}`
      }
      emptyMessage='No assignments yet. Click "Assign teacher" to create one.'
    />
  );
}
