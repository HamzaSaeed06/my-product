import { apiRequest } from "@/lib/apiClient";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreateTicketDialog } from "./create-dialog";
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

interface Customer {
  id: string;
  name: string;
  customerCode: string;
}

const PRIORITY_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  LOW: "secondary",
  MEDIUM: "secondary",
  HIGH: "default",
  URGENT: "destructive",
};

export default async function SupportPage() {
  const [tickets, customers, user] = await Promise.all([
    apiRequest<Ticket[]>("/api/v1/support-tickets"),
    apiRequest<Customer[]>("/api/v1/customers"),
    getCurrentUser(),
  ]);

  return (
    <div>
      <PageHeader title="Support" description="Ticket list, assignment, and resolution." action={<CreateTicketDialog customers={customers} />} />

      {tickets.length === 0 ? (
        <p className="text-sm text-muted-foreground">No support tickets yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assigned to</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{t.ticketNumber}</TableCell>
                  <TableCell>{t.customer.name}</TableCell>
                  <TableCell className="text-foreground">{t.subject}</TableCell>
                  <TableCell>
                    <Badge variant={PRIORITY_VARIANT[t.priority]}>{t.priority}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{t.assignedTo?.fullName ?? "Unassigned"}</TableCell>
                  <TableCell>
                    <Badge variant={t.status === "OPEN" ? "destructive" : t.status === "RESOLVED" || t.status === "CLOSED" ? "default" : "secondary"}>
                      {t.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {user ? <TicketActions ticketId={t.id} status={t.status} currentUserId={user.id} assignedToId={t.assignedToId} /> : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
