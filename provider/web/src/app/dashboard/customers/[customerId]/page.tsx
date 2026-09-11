import Link from "next/link";
import { apiRequest } from "@/lib/apiClient";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Deployment {
  id: string;
  version: string;
  url: string;
  status: string;
  healthStatus: string;
}

interface License {
  id: string;
  licenseNumber: string;
  status: "ACTIVE" | "SUSPENDED" | "REVOKED";
  issuedAt: string;
  expiresAt: string;
  plan: { name: string };
  deployment: { url: string };
}

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
}

interface CustomerDetail {
  id: string;
  customerCode: string;
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  status: "ACTIVE" | "INACTIVE";
  notes: string | null;
  deployments: Deployment[];
  licenses: License[];
  tickets: Ticket[];
}

export default async function CustomerDetailPage({ params }: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await params;
  const customer = await apiRequest<CustomerDetail>(`/api/v1/customers/${customerId}`);

  return (
    <div>
      <PageHeader
        title={customer.name}
        description={`${customer.customerCode} · ${customer.contactName} · ${customer.contactEmail}`}
        action={<Badge variant={customer.status === "ACTIVE" ? "default" : "secondary"}>{customer.status}</Badge>}
      />

      {customer.notes ? <p className="mb-6 text-sm text-muted-foreground">{customer.notes}</p> : null}

      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Deployments</h2>
        {customer.deployments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No deployments yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Health</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customer.deployments.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <Link href={`/dashboard/deployments/${d.id}`} className="text-foreground hover:underline">
                        {d.url}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{d.version}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{d.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={d.healthStatus === "HEALTHY" ? "default" : d.healthStatus === "DOWN" ? "destructive" : "secondary"}>
                        {d.healthStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">License history</h2>
        {customer.licenses.length === 0 ? (
          <p className="text-sm text-muted-foreground">No licenses issued yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>License #</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customer.licenses.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{l.licenseNumber}</TableCell>
                    <TableCell>{l.plan.name}</TableCell>
                    <TableCell>
                      <Badge variant={l.status === "ACTIVE" ? "default" : "secondary"}>{l.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{l.issuedAt.slice(0, 10)}</TableCell>
                    <TableCell className="text-muted-foreground">{l.expiresAt.slice(0, 10)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Support tickets</h2>
        {customer.tickets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No support tickets.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {customer.tickets.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">{t.ticketNumber}</p>
                  <p className="text-sm text-foreground">{t.subject}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary">{t.priority}</Badge>
                  <Badge variant={t.status === "OPEN" ? "destructive" : t.status === "RESOLVED" || t.status === "CLOSED" ? "default" : "secondary"}>
                    {t.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
