"use client";

import { useState } from "react";
import { Plus, Tags } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { mockFeeStructures } from "@/lib/mock/fee-structures";
import { feeStructureColumns } from "./columns";
import { StructureSheet } from "./structure-sheet";
import { CategoriesDialog } from "./categories-dialog";

export default function FeeStructuresPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Fee Structures"
        description="Templates — a category, class, campus and amount bundled together. Assign one to a student from Student Fees to actually charge them."
        actions={
          <>
            <Button size="sm" variant="outline" onClick={() => setCategoriesOpen(true)}>
              <Tags className="size-3.5" />
              Manage categories
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-3.5" />
              Create structure
            </Button>
          </>
        }
      />
      <DataTable
        columns={feeStructureColumns}
        data={mockFeeStructures}
        emptyTitle="No fee structures yet"
        emptyDescription="Create one for a class to start assigning it to students."
      />
      <StructureSheet open={createOpen} onOpenChange={setCreateOpen} />
      <CategoriesDialog open={categoriesOpen} onOpenChange={setCategoriesOpen} />
    </div>
  );
}
