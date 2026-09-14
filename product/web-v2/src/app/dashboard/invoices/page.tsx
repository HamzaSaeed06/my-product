"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { mockInvoices } from "@/lib/mock/invoices";
import { invoiceColumns } from "./columns";
import { CreateInvoiceDialog } from "./create-dialog";

export default function InvoicesPage() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Invoices"
        description="A billing document — line items reference a fee category directly. Void is terminal, there's no un-void."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" />
            Create invoice
          </Button>
        }
      />
      <DataTable columns={invoiceColumns} data={mockInvoices} emptyTitle="No invoices yet" emptyDescription="Create one to bill a student." />
      <CreateInvoiceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
