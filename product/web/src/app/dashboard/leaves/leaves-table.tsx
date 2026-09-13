"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { LeaveActionButtons } from "./decide-buttons";

interface Leave {
  id: string;
  subjectType: "STUDENT" | "TEACHER";
  fromDate: string;
  toDate: string;
  reason: string;
  isRetrospective: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  student: { fullName: string; studentCode: string } | null;
  teacher: { user: { fullName: string } } | null;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
  CANCELLED: "secondary",
};

function subjectName(leave: Leave): string {
  return (leave.subjectType === "STUDENT" ? leave.student?.fullName : leave.teacher?.user.fullName) ?? "";
}

// Client wrapper for the Server/Client boundary reason documented in
// DESIGN.md — the page fetches (and resolves permissions), this owns the
// DataTable column defs.
export function LeavesTable({
  leaves,
  canApprove,
  canReject,
  canCancel,
}: {
  leaves: Leave[];
  canApprove: boolean;
  canReject: boolean;
  canCancel: boolean;
}) {
  const canAct = canApprove || canReject || canCancel;

  const columns: DataTableColumn<Leave>[] = [
    {
      key: "subject",
      header: "Subject",
      sortValue: (leave) => subjectName(leave),
      render: (leave) => (
        <>
          <p className="font-medium text-foreground">{subjectName(leave)}</p>
          <p className="text-xs text-muted-foreground">
            {leave.subjectType === "STUDENT" ? `Student · ${leave.student?.studentCode}` : "Teacher"}
          </p>
        </>
      ),
    },
    {
      key: "dates",
      header: "Dates",
      sortValue: (leave) => leave.fromDate,
      render: (leave) => (
        <span className="text-muted-foreground">
          {leave.fromDate.slice(0, 10)} → {leave.toDate.slice(0, 10)}
          {leave.isRetrospective ? (
            <Badge variant="secondary" className="ml-2">
              Retrospective
            </Badge>
          ) : null}
        </span>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      render: (leave) => <span className="text-muted-foreground">{leave.reason}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortValue: (leave) => leave.status,
      render: (leave) => <Badge variant={STATUS_VARIANT[leave.status]}>{leave.status}</Badge>,
    },
  ];

  if (canAct) {
    columns.push({
      key: "actions",
      header: "Actions",
      align: "right",
      render: (leave) => (
        <LeaveActionButtons
          id={leave.id}
          status={leave.status}
          canApprove={canApprove}
          canReject={canReject}
          canCancel={canCancel}
        />
      ),
    });
  }

  return (
    <DataTable
      columns={columns}
      data={leaves}
      getRowKey={(leave) => leave.id}
      searchPlaceholder="Search leaves..."
      searchText={(leave) => `${subjectName(leave)} ${leave.student?.studentCode ?? ""} ${leave.reason}`}
      emptyMessage="No leave requests yet."
      pageSize={15}
    />
  );
}
