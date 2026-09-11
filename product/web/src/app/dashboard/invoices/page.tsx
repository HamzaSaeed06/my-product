import Link from "next/link";
import { apiRequest } from "@/lib/apiClient";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreateInvoiceDialog } from "./create-dialog";
import { VoidInvoiceDialog } from "./void-dialog";

interface Student {
  id: string;
  fullName: string;
  studentCode: string;
  status: "ACTIVE" | "WITHDRAWN" | "ARCHIVED";
}
interface NamedOption {
  id: string;
  name: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  totalAmount: string;
  dueDate: string;
  status: "UNPAID" | "PARTIALLY_PAID" | "PAID" | "VOID";
}

const STATUS_VARIANT: Record<Invoice["status"], "default" | "secondary"> = {
  UNPAID: "secondary",
  PARTIALLY_PAID: "secondary",
  PAID: "default",
  VOID: "secondary",
};

export default async function InvoicesPage() {
  const [invoices, students, categories] = await Promise.all([
    apiRequest<Invoice[]>("/api/v1/invoices"),
    apiRequest<Student[]>("/api/v1/students"),
    apiRequest<NamedOption[]>("/api/v1/fee-categories"),
  ]);

  const activeStudents = students.filter((s) => s.status === "ACTIVE");
  const studentById = new Map(students.map((s) => [s.id, s]));

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Generate a fee invoice for a student, then record payments against it."
        action={<CreateInvoiceDialog students={activeStudents} categories={categories} />}
      />

      {invoices.length === 0 ? (
        <p className="text-sm text-muted-foreground">No invoices yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    <Link href={`/dashboard/invoices/${inv.id}`} className="hover:underline">
                      {inv.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">{studentById.get(inv.studentId)?.fullName ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{inv.totalAmount}</TableCell>
                  <TableCell className="text-muted-foreground">{inv.dueDate.slice(0, 10)}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[inv.status]}>{inv.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {inv.status === "UNPAID" ? <VoidInvoiceDialog invoiceId={inv.id} /> : null}
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
