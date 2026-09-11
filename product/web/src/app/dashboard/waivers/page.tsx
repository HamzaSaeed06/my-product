import { apiRequest } from "@/lib/apiClient";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreateWaiverDialog } from "./create-dialog";
import { DecideWaiverButtons } from "./decide-buttons";

interface Invoice {
  id: string;
  invoiceNumber: string;
  totalAmount: string;
  status: string;
}

interface Waiver {
  id: string;
  amount: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  invoice: { invoiceNumber: string };
}

export default async function WaiversPage() {
  const [waivers, invoices] = await Promise.all([
    apiRequest<Waiver[]>("/api/v1/waivers"),
    apiRequest<Invoice[]>("/api/v1/invoices"),
  ]);

  const eligibleInvoices = invoices
    .filter((i) => i.status === "UNPAID" || i.status === "PARTIALLY_PAID")
    .map((i) => ({ id: i.id, label: `${i.invoiceNumber} · ${i.totalAmount}` }));

  return (
    <div>
      <PageHeader
        title="Waivers"
        description="Full or partial fee forgiveness on a specific invoice — reason and approval required."
        action={<CreateWaiverDialog invoices={eligibleInvoices} />}
      />

      {waivers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No waivers yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {waivers.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{w.invoice.invoiceNumber}</TableCell>
                  <TableCell className="text-muted-foreground">{w.amount}</TableCell>
                  <TableCell className="text-muted-foreground">{w.reason}</TableCell>
                  <TableCell>
                    <Badge variant={w.status === "APPROVED" ? "default" : "secondary"}>{w.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{w.status === "PENDING" ? <DecideWaiverButtons id={w.id} /> : null}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
