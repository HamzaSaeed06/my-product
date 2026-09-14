"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { mockStudentFees } from "@/lib/mock/student-fees";
import { studentFeeColumns } from "./columns";
import { AssignFeeSheet } from "./assign-sheet";

export default function StudentFeesPage() {
  const [assignOpen, setAssignOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Student Fees"
        description="Which fee structures are actually charged to which student, with any per-student override amount."
        actions={
          <Button size="sm" onClick={() => setAssignOpen(true)}>
            <Plus className="size-3.5" />
            Assign fee
          </Button>
        }
      />
      <DataTable
        columns={studentFeeColumns}
        data={mockStudentFees}
        emptyTitle="No fees assigned yet"
        emptyDescription="Assign a fee structure to a student to start billing them."
      />
      <AssignFeeSheet open={assignOpen} onOpenChange={setAssignOpen} />
    </div>
  );
}
