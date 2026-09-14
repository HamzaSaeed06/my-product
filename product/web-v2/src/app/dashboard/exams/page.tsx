"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { mockExams } from "@/lib/mock/exams";
import { examColumns } from "./columns";
import { CreateExamDialog } from "./create-dialog";

export default function ExamsPage() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Exams"
        description="A named series for an academic year — Midterm, Final Term. Add papers per section and subject from each exam's own page."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" />
            Create exam
          </Button>
        }
      />
      <DataTable columns={examColumns} data={mockExams} emptyTitle="No exams yet" emptyDescription="Create one to start scheduling papers." />
      <CreateExamDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
