"use client";

import { PageHeader } from "@/components/page-header";
import { StatStrip } from "@/components/stat-tile";
import { StatusDot } from "@/components/status-dot";
import { DataTable } from "@/components/data-table";
import { mockReconciliationSummary, mockReconciliationExceptions } from "@/lib/mock/reconciliation";
import { exceptionColumns } from "./columns";

export default function ReconciliationPage() {
  const summary = mockReconciliationSummary;
  const matched = summary.gatewayCount === summary.recordedCount && summary.gatewayTotal === summary.recordedTotal;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reconciliation"
        description="Compares gateway settlement data against recorded online payments — read-only. A callback that can't be matched never auto-creates a payment; it becomes an exception below for manual review."
        actions={<StatusDot tone={matched ? "success" : "warning"}>{matched ? "Matched" : "Mismatch"}</StatusDot>}
      />

      <div className="flex flex-col gap-2">
        <span className="label-eyebrow text-muted-foreground">{summary.date}</span>
        <StatStrip
          entries={[
            { label: "Gateway transactions", value: summary.gatewayCount },
            { label: "Gateway total", value: `Rs ${summary.gatewayTotal.toLocaleString()}` },
            { label: "Recorded payments", value: summary.recordedCount },
            { label: "Recorded total", value: `Rs ${summary.recordedTotal.toLocaleString()}` },
          ]}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="label-eyebrow text-muted-foreground">Exceptions</span>
        <DataTable
          columns={exceptionColumns}
          data={mockReconciliationExceptions}
          emptyTitle="No exceptions"
          emptyDescription="Every gateway transaction matches a recorded payment."
        />
      </div>
    </div>
  );
}
