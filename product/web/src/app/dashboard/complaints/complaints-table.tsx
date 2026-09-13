"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/data-table";

interface Complaint {
  id: string;
  category: string;
  description: string;
  status: "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "REOPENED";
  student: { fullName: string; studentCode: string } | null;
  assignedTo: { fullName: string } | null;
  createdAt: string;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  OPEN: "secondary",
  ASSIGNED: "secondary",
  IN_PROGRESS: "secondary",
  RESOLVED: "default",
  CLOSED: "default",
  REOPENED: "destructive",
};

// Client wrapper for the Server/Client boundary reason documented in
// DESIGN.md — the page fetches, this owns the DataTable column defs.
export function ComplaintsTable({ complaints }: { complaints: Complaint[] }) {
  const columns: DataTableColumn<Complaint>[] = [
    {
      key: "category",
      header: "Category",
      sortValue: (c) => c.category,
      render: (c) => (
        <>
          <p className="font-medium text-foreground">{c.category}</p>
          <p className="max-w-xs truncate text-xs text-muted-foreground">{c.description}</p>
        </>
      ),
    },
    {
      key: "student",
      header: "Student",
      sortValue: (c) => c.student?.fullName ?? "",
      render: (c) => (
        <span className="text-muted-foreground">
          {c.student ? `${c.student.fullName} (${c.student.studentCode})` : "—"}
        </span>
      ),
    },
    {
      key: "assignedTo",
      header: "Assigned to",
      sortValue: (c) => c.assignedTo?.fullName ?? "",
      render: (c) => <span className="text-muted-foreground">{c.assignedTo?.fullName ?? "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortValue: (c) => c.status,
      render: (c) => <Badge variant={STATUS_VARIANT[c.status]}>{c.status.replace("_", " ")}</Badge>,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (c) => (
        <Link href={`/dashboard/complaints/${c.id}`} className="text-sm text-foreground hover:underline">
          View →
        </Link>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={complaints}
      getRowKey={(c) => c.id}
      searchPlaceholder="Search complaints..."
      searchText={(c) => `${c.category} ${c.description} ${c.student?.fullName ?? ""} ${c.student?.studentCode ?? ""}`}
      emptyMessage="No complaints yet."
      pageSize={15}
    />
  );
}
