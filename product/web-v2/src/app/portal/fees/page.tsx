"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { StatusDot, type StatusTone } from "@/components/status-dot";
import { getStudentById } from "@/lib/mock/students";
import { mockInvoices, type Invoice, type InvoiceStatus } from "@/lib/mock/invoices";
import { usePortal } from "../portal-context";
import { PayInvoiceDialog } from "./pay-dialog";

const STATUS_TONE: Record<InvoiceStatus, StatusTone> = { UNPAID: "neutral", PARTIALLY_PAID: "warning", PAID: "success", VOID: "danger" };
const STATUS_LABEL: Record<InvoiceStatus, string> = { UNPAID: "Unpaid", PARTIALLY_PAID: "Partially paid", PAID: "Paid", VOID: "Void" };

export default function PortalFeesPage() {
  const { role, activeChildId } = usePortal();
  const student = getStudentById(activeChildId);
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices.filter((i) => i.studentId === activeChildId));
  const [payTarget, setPayTarget] = useState<Invoice | null>(null);

  function markPaid(invoiceId: string) {
    setInvoices((prev) => prev.map((i) => (i.id === invoiceId ? { ...i, status: "PAID" } : i)));
    toast.success("Invoice marked paid.");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Fees" description={`${student?.fullName}'s invoices.`} />
      {role === "STUDENT" && <p className="text-sm text-muted-foreground">Contact the office or your parent to make a payment.</p>}
      <div className="surface-ring flex flex-col divide-y divide-border overflow-hidden rounded-[var(--card-radius)]">
        {invoices.length === 0 ? (
          <p className="px-4 py-3 text-sm text-muted-foreground">No invoices yet.</p>
        ) : (
          invoices.map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="flex flex-col">
                <span className="font-mono text-sm text-foreground">{invoice.invoiceNumber}</span>
                <span className="text-xs text-muted-foreground">Due {invoice.dueDate}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-foreground">Rs {invoice.totalAmount.toLocaleString()}</span>
                <StatusDot tone={STATUS_TONE[invoice.status]}>{STATUS_LABEL[invoice.status]}</StatusDot>
                {role === "PARENT" && (invoice.status === "UNPAID" || invoice.status === "PARTIALLY_PAID") && (
                  <Button size="sm" onClick={() => setPayTarget(invoice)}>
                    Pay online
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      <PayInvoiceDialog invoice={payTarget} onOpenChange={(open) => !open && setPayTarget(null)} onPaid={markPaid} />
    </div>
  );
}
