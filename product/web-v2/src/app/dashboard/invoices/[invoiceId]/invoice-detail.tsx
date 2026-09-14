"use client";

import { useState } from "react";
import { Ban } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { StatusDot, type StatusTone } from "@/components/status-dot";
import { getStudentById } from "@/lib/mock/students";
import { mockFeeCategories } from "@/lib/mock/fee-categories";
import { mockInvoiceItems, type Invoice, type InvoiceStatus } from "@/lib/mock/invoices";
import { mockWaivers } from "@/lib/mock/waivers";
import { VoidInvoiceDialog } from "../void-dialog";

const STATUS_TONE: Record<InvoiceStatus, StatusTone> = { UNPAID: "neutral", PARTIALLY_PAID: "warning", PAID: "success", VOID: "danger" };
const STATUS_LABEL: Record<InvoiceStatus, string> = { UNPAID: "Unpaid", PARTIALLY_PAID: "Partially paid", PAID: "Paid", VOID: "Void" };

export function InvoiceDetail({ invoice }: { invoice: Invoice }) {
  const [status, setStatus] = useState(invoice.status);
  const [voidOpen, setVoidOpen] = useState(false);

  const student = getStudentById(invoice.studentId);
  const items = mockInvoiceItems.filter((i) => i.invoiceId === invoice.id);
  const approvedWaivers = mockWaivers.filter((w) => w.invoiceId === invoice.id && w.status === "APPROVED");
  const waivedTotal = approvedWaivers.reduce((sum, w) => sum + w.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={invoice.invoiceNumber}
        description={`${student?.fullName} · ${student?.admissionNo} · Due ${invoice.dueDate}`}
        actions={
          <>
            <StatusDot tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</StatusDot>
            {status !== "VOID" && (
              <Button size="sm" variant="destructive" onClick={() => setVoidOpen(true)}>
                <Ban className="size-3.5" />
                Void
              </Button>
            )}
          </>
        }
      />

      {status === "VOID" && invoice.voidReason && (
        <p className="rounded-[var(--card-radius)] border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">{invoice.voidReason}</p>
      )}

      <div className="surface-ring overflow-hidden rounded-[var(--card-radius)]">
        <div className="divide-y divide-border">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-4 py-2.5">
              <div className="flex flex-col">
                <span className="text-sm text-foreground">{item.description}</span>
                <span className="text-xs text-muted-foreground">{mockFeeCategories.find((c) => c.id === item.feeCategoryId)?.name}</span>
              </div>
              <span className="font-mono text-sm text-foreground">Rs {item.amount.toLocaleString()}</span>
            </div>
          ))}
          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="text-sm text-foreground">Total</span>
            <span className="font-mono text-sm text-foreground">Rs {invoice.totalAmount.toLocaleString()}</span>
          </div>
          {approvedWaivers.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2.5 text-success">
              <span className="text-sm">Waived</span>
              <span className="font-mono text-sm">− Rs {waivedTotal.toLocaleString()}</span>
            </div>
          )}
          <div className="flex items-center justify-between bg-muted/40 px-4 py-2.5">
            <span className="text-sm font-medium text-foreground">Balance after waivers</span>
            <span className="font-mono text-sm font-medium text-foreground">Rs {(invoice.totalAmount - waivedTotal).toLocaleString()}</span>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Payments against this invoice are tracked separately once the Payments module lands — this balance doesn&apos;t yet subtract amounts already paid.
      </p>

      <VoidInvoiceDialog open={voidOpen} onOpenChange={setVoidOpen} onConfirm={() => setStatus("VOID")} />
    </div>
  );
}
