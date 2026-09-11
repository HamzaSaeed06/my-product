import { getCurrentUser } from "@/lib/session";
import { apiRequest } from "@/lib/apiClient";
import { ChildSwitcher } from "@/components/child-switcher";
import { Badge } from "@/components/ui/badge";

interface Invoice {
  id: string;
  invoiceNumber: string;
  totalAmount: string;
  dueDate: string;
  status: "UNPAID" | "PARTIALLY_PAID" | "PAID" | "VOID";
}

interface Student {
  id: string;
  fullName: string;
}

const STATUS_VARIANT: Record<string, "default" | "secondary"> = {
  UNPAID: "secondary",
  PARTIALLY_PAID: "secondary",
  PAID: "default",
  VOID: "secondary",
};

export default async function PortalFeesPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { studentId: requestedStudentId } = await searchParams;

  const students = await apiRequest<Student[]>("/api/v1/students");
  const studentId = requestedStudentId ?? students[0]?.id;

  if (!studentId) {
    return (
      <div>
        <h1 className="text-lg font-semibold text-foreground">Fees</h1>
        <p className="mt-4 text-sm text-muted-foreground">No children linked to your account yet.</p>
      </div>
    );
  }

  const invoices = await apiRequest<Invoice[]>(`/api/v1/invoices?studentId=${studentId}`);
  const outstanding = invoices.filter((i) => i.status === "UNPAID" || i.status === "PARTIALLY_PAID");

  return (
    <div>
      <h1 className="text-lg font-semibold text-foreground">Fees</h1>
      <ChildSwitcher students={students} selectedId={studentId} basePath="/portal/fees" />

      {invoices.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No invoices yet.</p>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {invoices.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="font-mono text-sm text-foreground">{inv.invoiceNumber}</p>
                <p className="text-xs text-muted-foreground">Due {inv.dueDate.slice(0, 10)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{inv.totalAmount}</p>
                <Badge variant={STATUS_VARIANT[inv.status]}>{inv.status.replace("_", " ")}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {outstanding.length > 0 ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Online payment isn&apos;t available yet — please pay outstanding invoices through the office.
        </p>
      ) : null}
    </div>
  );
}
