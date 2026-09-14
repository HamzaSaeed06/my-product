"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { mockHomework } from "@/lib/mock/homework";
import { homeworkColumns } from "./columns";
import { HomeworkSheet } from "./homework-sheet";

export default function HomeworkPage() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Homework"
        description="A formal, graded assignment for one section — kept as a draft until you publish it."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" />
            Create homework
          </Button>
        }
      />
      <DataTable
        columns={homeworkColumns}
        data={mockHomework}
        emptyTitle="No homework yet"
        emptyDescription="Create one for a section to get started."
      />
      <HomeworkSheet open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
