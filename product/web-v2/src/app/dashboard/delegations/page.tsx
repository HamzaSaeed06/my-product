"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { mockDelegations } from "@/lib/mock/delegations";
import { delegationColumns } from "./columns";
import { DelegationSheet } from "./delegation-sheet";

export default function DelegationsPage() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Delegations"
        description="Temporary authority handoffs — e.g. covering a Campus Head's role while they're on leave."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" />
            New delegation
          </Button>
        }
      />
      <DataTable
        columns={delegationColumns}
        data={mockDelegations}
        emptyTitle="No delegations yet"
        emptyDescription="Grant temporary access when someone needs to cover another role."
      />
      <DelegationSheet open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
