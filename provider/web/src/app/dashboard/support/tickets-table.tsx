"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { TicketActions } from "./ticket-actions";

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  assignedToId: string | null;
  customer: { id: string; name: string };
  assignedTo: { id: string; fullName: string } | null;
}

const PRIORITY_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  LOW: "secondary",
  MEDIUM: "secondary",
  HIGH: "default",
  URGENT: "destructive",
};

export function TicketsTable({ tickets, currentUserId }: { tickets: Ticket[]; currentUserId: string | null }) {
  const columns: DataTableColumn<Ticket>[] = [
    {
      key: "ticketNumber",
      header: "Ticket #",
      sortValue: (t) => t.ticketNumber,
      render: (t) => <span className="font-mono text-xs text-muted-foreground">{t.ticketNumber}</span>,
    },
    {
      key: "customer",
      header: "Customer",
      sortValue: (t) => t.customer.name,
      render: (t) => t.customer.name,
    },
    {
      key: "subject",
      header: "Subject",
      sortValue: (t) => t.subject,
      render: (t) => <span className="text-foreground">{t.subject}</span>,
    },
    {
      key: "priority",
      header: "Priority",
      sortValue: (t) => t.priority,
      render: (t) => <Badge variant={PRIORITY_VARIANT[t.priority]}>{t.priority}</Badge>,
    },
    {
      key: "assignedTo",
      header: "Assigned to",
      sortValue: (t) => t.assignedTo?.fullName ?? "",
      render: (t) => <span className="text-muted-foreground">{t.assignedTo?.fullName ?? "Unassigned"}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortValue: (t) => t.status,
      render: (t) => (
        <Badge variant={t.status === "OPEN" ? "destructive" : t.status === "RESOLVED" || t.status === "CLOSED" ? "default" : "secondary"}>
          {t.status.replace("_", " ")}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (t) =>
        currentUserId ? (
          <TicketActions
            ticketId={t.id}
            subject={t.subject}
            status={t.status}
            currentUserId={currentUserId}
            assignedToId={t.assignedToId}
          />
        ) : null,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={tickets}
      getRowKey={(t) => t.id}
      searchPlaceholder="Search tickets..."
      searchText={(t) => `${t.ticketNumber} ${t.subject} ${t.customer.name}`}
      emptyMessage="No tickets match your search."
      pageSize={12}
    />
  );
}
