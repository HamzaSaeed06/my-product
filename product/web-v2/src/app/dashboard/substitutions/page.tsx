"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { mockSubstitutions } from "@/lib/mock/substitutions";
import { substitutionColumns } from "./columns";
import { AssignSubstituteDialog } from "./assign-dialog";

export default function SubstitutionsPage() {
  const [assignOpen, setAssignOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Substitutions"
        description="Cover for a teacher's period — one per class-period per day. Cancelling reinstates the original teacher without deleting the record."
        actions={
          <Button size="sm" onClick={() => setAssignOpen(true)}>
            <Plus className="size-3.5" />
            Assign substitute
          </Button>
        }
      />
      <DataTable
        columns={substitutionColumns}
        data={mockSubstitutions}
        emptyTitle="No substitutions"
        emptyDescription="Assign a substitute when a teacher can't take their period."
      />
      <AssignSubstituteDialog open={assignOpen} onOpenChange={setAssignOpen} />
    </div>
  );
}
