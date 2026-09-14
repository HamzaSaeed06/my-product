"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { mockWaivers } from "@/lib/mock/waivers";
import { waiverColumns } from "./columns";
import { RequestWaiverDialog } from "./request-dialog";

export default function WaiversPage() {
  const [requestOpen, setRequestOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Waivers"
        description="Reduces what's already owed on a specific invoice — needs approval before it takes effect."
        actions={
          <Button size="sm" onClick={() => setRequestOpen(true)}>
            <Plus className="size-3.5" />
            Request waiver
          </Button>
        }
      />
      <DataTable columns={waiverColumns} data={mockWaivers} emptyTitle="No waivers requested" emptyDescription="Request one against an invoice to get it approved." />
      <RequestWaiverDialog open={requestOpen} onOpenChange={setRequestOpen} />
    </div>
  );
}
