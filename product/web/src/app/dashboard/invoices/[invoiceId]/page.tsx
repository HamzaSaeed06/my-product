import Link from "next/link";
import { apiRequest } from "@/lib/apiClient";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface InvoiceItem {
  id: string;
  description: string;
  amount: string;
  feeCategory: { name: string };
}

interface Allocation {
  id: string;
  amount: string;
}

interface Waiver {
  id: string;
  amount: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  totalAmount: string;
  dueDate: string;
  status: "UNPAID" | "PARTIALLY_PAID" | "PAID" | "VOID";
  voidReason: string | null;
  items: InvoiceItem[];
  allocations: Allocation[];
  waivers: Waiver[];
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const { invoiceId } = await params;
  const invoice = await apiRequest<Invoice>(`/api/v1/invoices/${invoiceId}`);

  const paid = invoice.allocations.reduce((sum, a) => sum + Number(a.amount), 0);
  const waived = invoice.waivers.reduce((sum, w) => sum + Number(w.amount), 0);

  return (
    <div>
      <PageHeader
        title={invoice.invoiceNumber}
        description={`Due ${invoice.dueDate.slice(0, 10)} · Total ${invoice.totalAmount}`}
        action={<Badge variant={invoice.status === "PAID" ? "default" : "secondary"}>{invoice.status}</Badge>}
      />

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoice.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="text-muted-foreground">{item.feeCategory.name}</TableCell>
                <TableCell className="font-medium">{item.description}</TableCell>
                <TableCell className="text-right text-muted-foreground">{item.amount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex flex-col gap-1 text-sm">
        <p className="text-foreground">Paid: {paid.toFixed(2)}</p>
        {waived > 0 ? <p className="text-muted-foreground">Waived: {waived.toFixed(2)}</p> : null}
        <p className="text-muted-foreground">
          Remaining: {(Number(invoice.totalAmount) - paid - waived).toFixed(2)}
        </p>
        {invoice.voidReason ? <p className="text-destructive">Voided: {invoice.voidReason}</p> : null}
      </div>

      {invoice.status !== "PAID" && invoice.status !== "VOID" ? (
        <Link href="/dashboard/payments" className="mt-4 inline-block text-sm text-foreground hover:underline">
          Record a payment →
        </Link>
      ) : null}
    </div>
  );
}
