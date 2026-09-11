import { getCurrentUser } from "@/lib/session";
import { apiRequest } from "@/lib/apiClient";
import { ChildSwitcher } from "@/components/child-switcher";
import { Badge } from "@/components/ui/badge";
import { PayOnlineButton } from "./pay-online-button";

interface Invoice {
  id: string;
  invoiceNumber: string;
  totalAmount: string;
  dueDate: string;
  status: "UNPAID" | "PARTIALLY_PAID" | "PAID" | "VOID";
  allocations: { amount: string }[];
  waivers: { amount: string }[];
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
  const canPayOnline = user.roles.includes("PARENT");

  function remainingDue(inv: Invoice): string {
    const paid = inv.allocations.reduce((sum, a) => sum + Number(a.amount), 0);
    const waived = inv.waivers.reduce((sum, w) => sum + Number(w.amount), 0);
    return Math.max(Number(inv.totalAmount) - paid - waived, 0).toFixed(2);
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-foreground">Fees</h1>
      <ChildSwitcher students={students} selectedId={studentId} basePath="/portal/fees" />

      {invoices.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No invoices yet.</p>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {invoices.map((inv) => {
            const due = remainingDue(inv);
            const isOutstanding = inv.status === "UNPAID" || inv.status === "PARTIALLY_PAID";
            return (
              <div key={inv.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="font-mono text-sm text-foreground">{inv.invoiceNumber}</p>
                  <p className="text-xs text-muted-foreground">Due {inv.dueDate.slice(0, 10)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{inv.totalAmount}</p>
                    <Badge variant={STATUS_VARIANT[inv.status]}>{inv.status.replace("_", " ")}</Badge>
                  </div>
                  {canPayOnline && isOutstanding && Number(due) > 0 ? (
                    <PayOnlineButton invoiceId={inv.id} amount={due} />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {outstanding.length > 0 && !canPayOnline ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Online payment can be done by a parent — please pay outstanding invoices through the office.
        </p>
      ) : null}
    </div>
  );
}
