"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { mockInchargeScopes } from "@/lib/mock/incharge-scopes";
import { scopeColumns } from "./columns";
import { ScopeSheet } from "./scope-sheet";

export default function InchargeScopesPage() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Incharge Scopes"
        description="Which classes and sections each Incharge can see — dynamic, overlap allowed by design."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" />
            New scope
          </Button>
        }
      />
      <DataTable
        columns={scopeColumns}
        data={mockInchargeScopes}
        emptyTitle="No scopes yet"
        emptyDescription="Grant an Incharge access to their first set of classes and sections."
      />
      <ScopeSheet open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
