"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { mockSubjects } from "@/lib/mock/subjects";
import { subjectColumns } from "./columns";
import { SubjectSheet } from "./subject-sheet";

export default function SubjectsPage() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Subjects"
        description="Institute-wide subject catalog — shared across every campus."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" />
            New subject
          </Button>
        }
      />
      <DataTable
        columns={subjectColumns}
        data={mockSubjects}
        emptyTitle="No subjects yet"
        emptyDescription="Add the institute's first subject to the catalog."
      />
      <SubjectSheet open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
