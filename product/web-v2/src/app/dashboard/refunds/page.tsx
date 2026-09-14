"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { mockRefunds } from "@/lib/mock/refunds";
import { refundColumns } from "./columns";
import { RequestRefundDialog } from "./request-dialog";

export default function RefundsPage() {
  const [requestOpen, setRequestOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Refunds"
        description="Money returned against a specific payment — a 4-step lifecycle: requested, approved, then separately marked completed once actually paid out."
        actions={
          <Button size="sm" onClick={() => setRequestOpen(true)}>
            <Plus className="size-3.5" />
            Request refund
          </Button>
        }
      />
      <DataTable columns={refundColumns} data={mockRefunds} emptyTitle="No refunds requested" emptyDescription="Request one against a payment to get it approved." />
      <RequestRefundDialog open={requestOpen} onOpenChange={setRequestOpen} />
    </div>
  );
}
