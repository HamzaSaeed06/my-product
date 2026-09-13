"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/data-table";

interface CampusOverview {
  id: string;
  name: string;
  students: number;
  teachers: number;
  sections: number;
  pendingAdmissions: number;
}

// A Server Component can't pass functions (column render/sortValue
// closures) as props to a Client Component — React serializes props across
// that boundary, and functions aren't serializable unless they're Server
// Actions. So this table — and the column definitions that need real
// functions — lives in its own small Client Component, taking only plain
// data (perCampus) from the server-rendered InstituteOverview.
export function CampusesTable({ perCampus }: { perCampus: CampusOverview[] }) {
  const columns: DataTableColumn<CampusOverview>[] = [
    {
      key: "name",
      header: "Campus",
      sortValue: (c) => c.name,
      render: (c) => <span className="font-medium text-foreground">{c.name}</span>,
    },
    {
      key: "students",
      header: "Students",
      align: "right",
      sortValue: (c) => c.students,
      render: (c) => <span className="tabular-nums">{c.students}</span>,
    },
    {
      key: "teachers",
      header: "Teachers",
      align: "right",
      sortValue: (c) => c.teachers,
      render: (c) => <span className="tabular-nums">{c.teachers}</span>,
    },
    {
      key: "sections",
      header: "Sections",
      align: "right",
      sortValue: (c) => c.sections,
      render: (c) => <span className="tabular-nums">{c.sections}</span>,
    },
    {
      key: "pendingAdmissions",
      header: "Pending admissions",
      align: "right",
      sortValue: (c) => c.pendingAdmissions,
      render: (c) =>
        c.pendingAdmissions > 0 ? (
          <Badge variant="secondary">{c.pendingAdmissions}</Badge>
        ) : (
          <span className="text-muted-foreground">0</span>
        ),
    },
    {
      key: "view",
      header: "",
      align: "right",
      render: (c) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/dashboard/students?campusId=${c.id}`}>Students</Link>} />
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/dashboard/teachers?campusId=${c.id}`}>Teachers</Link>} />
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/dashboard/admissions?campusId=${c.id}`}>Admissions</Link>} />
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={perCampus}
      getRowKey={(c) => c.id}
      searchPlaceholder="Search campuses..."
      searchText={(c) => c.name}
      emptyMessage="No campuses match your search."
    />
  );
}
