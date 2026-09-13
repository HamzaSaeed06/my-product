import { apiRequest } from "@/lib/apiClient";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { CreateInvoiceDialog } from "./create-dialog";
import { InvoicesTable } from "./invoices-table";

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

export default async function InvoicesPage() {
  // Mirrors invoice.create/invoice.void from routes.ts — Campus Head can
  // hold invoice.view without invoice.create, so the "Create Invoice"
  // dialog (and its students/fee-categories dropdown data, fetched only to
  // populate that dialog) must not render/fetch unconditionally. The
  // students fetch also feeds studentNameById's table labels for every
  // viewer, so when gated off it degrades to the table's existing "—"
  // fallback rather than a permission error.
  const currentUser = await getCurrentUser();
  const permissions = currentUser?.permissions ?? [];
  const canCreate = permissions.includes("invoice.create");
  const canVoid = permissions.includes("invoice.void");

  const [invoices, students, categories] = await Promise.all([
    apiRequest<Invoice[]>("/api/v1/invoices"),
    canCreate ? apiRequest<Student[]>("/api/v1/students") : Promise.resolve<Student[]>([]),
    canCreate ? apiRequest<NamedOption[]>("/api/v1/fee-categories") : Promise.resolve<NamedOption[]>([]),
  ]);

  const activeStudents = students.filter((s) => s.status === "ACTIVE");
  const studentNameById = Object.fromEntries(students.map((s) => [s.id, s.fullName]));

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Generate a fee invoice for a student, then record payments against it."
        action={canCreate ? <CreateInvoiceDialog students={activeStudents} categories={categories} /> : undefined}
      />

      {invoices.length === 0 ? (
        <p className="text-sm text-muted-foreground">No invoices yet.</p>
      ) : (
        <InvoicesTable invoices={invoices} studentNameById={studentNameById} canVoid={canVoid} />
      )}
    </div>
  );
}
