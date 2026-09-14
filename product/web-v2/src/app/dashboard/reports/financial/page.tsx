"use client";

import { PageHeader } from "@/components/page-header";
import { StatStrip } from "@/components/stat-tile";
import { ExportButton } from "@/components/export-button";
import { mockInvoices, type InvoiceStatus } from "@/lib/mock/invoices";
import { mockPayments } from "@/lib/mock/payments";
import { mockRefunds } from "@/lib/mock/refunds";

const STATUS_LABEL: Record<InvoiceStatus, string> = { UNPAID: "Unpaid", PARTIALLY_PAID: "Partially paid", PAID: "Paid", VOID: "Void" };

export default function FinancialReportPage() {
  const invoiced = mockInvoices.filter((i) => i.status !== "VOID").reduce((sum, i) => sum + i.totalAmount, 0);
  const collected = mockPayments.filter((p) => p.status === "SUCCESS").reduce((sum, p) => sum + p.amount, 0);
  const refunded = mockRefunds.filter((r) => r.status === "COMPLETED").reduce((sum, r) => sum + r.amount, 0);
  const outstanding = invoiced - collected;

  const byStatus = (Object.keys(STATUS_LABEL) as InvoiceStatus[]).map((status) => {
    const rows = mockInvoices.filter((i) => i.status === status);
    return { status, count: rows.length, total: rows.reduce((sum, i) => sum + i.totalAmount, 0) };
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Financial Report"
        description="Invoicing, collections and outstanding balances — computed live from Invoices, Payments and Refunds."
        actions={<ExportButton filename="financial-report.csv" rows={[["Status", "Count", "Total"], ...byStatus.map((s) => [STATUS_LABEL[s.status], s.count, s.total])]} />}
      />
      <StatStrip
        entries={[
          { label: "Total invoiced", value: `Rs ${invoiced.toLocaleString()}` },
          { label: "Total collected", value: `Rs ${collected.toLocaleString()}` },
          { label: "Outstanding", value: `Rs ${outstanding.toLocaleString()}` },
          { label: "Refunds paid out", value: `Rs ${refunded.toLocaleString()}` },
        ]}
      />
      <div className="surface-ring overflow-hidden rounded-[var(--card-radius)]">
        <div className="divide-y divide-border">
          {byStatus.map((s) => (
            <div key={s.status} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm text-foreground">{STATUS_LABEL[s.status]}</span>
              <span className="font-mono text-sm text-muted-foreground">{s.count} invoices · Rs {s.total.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
