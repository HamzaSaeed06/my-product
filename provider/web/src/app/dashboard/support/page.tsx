import { apiRequest } from "@/lib/apiClient";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { CreateTicketDialog } from "./create-dialog";
import { TicketsTable } from "./tickets-table";

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
        <TicketsTable tickets={tickets} currentUserId={user?.id ?? null} />
      )}
    </div>
  );
}
