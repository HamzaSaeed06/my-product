"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { mockCashClosings } from "@/lib/mock/cash-closing";
import { cashClosingColumns } from "./columns";
import { CreateClosingDialog } from "./create-dialog";

export default function CashClosingPage() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Cash Closing"
        description="One closing per campus per day — reconciles that day's cash collections against a manually counted balance."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" />
            Close today&apos;s cash
          </Button>
        }
      />
      <DataTable columns={cashClosingColumns} data={mockCashClosings} emptyTitle="No cash closings yet" emptyDescription="Close today's cash to get started." />
      <CreateClosingDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
