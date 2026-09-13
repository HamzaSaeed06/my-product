"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { mockAcademicYears } from "@/lib/mock/academic-years";
import { academicYearColumns } from "./columns";
import { AcademicYearSheet } from "./academic-year-sheet";

export default function AcademicYearsPage() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Academic Years"
        description="Sessions can overlap by design — this is deliberate, not a bug."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" />
            New academic year
          </Button>
        }
      />
      <DataTable
        columns={academicYearColumns}
        data={mockAcademicYears}
        emptyTitle="No academic years yet"
        emptyDescription="Create the institute's first academic year to start opening sections."
      />
      <AcademicYearSheet open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
