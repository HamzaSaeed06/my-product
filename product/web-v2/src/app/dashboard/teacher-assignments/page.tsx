"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { mockTeacherAssignments } from "@/lib/mock/teacher-assignments";
import { assignmentColumns } from "./columns";
import { AssignmentSheet } from "./assignment-sheet";

export default function TeacherAssignmentsPage() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Teacher Assignments"
        description="Which teacher teaches which subject to which section, for the current academic year."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" />
            Assign teacher
          </Button>
        }
      />
      <DataTable
        columns={assignmentColumns}
        data={mockTeacherAssignments}
        emptyTitle="No assignments yet"
        emptyDescription="Assign a teacher to a subject and section to get started."
      />
      <AssignmentSheet open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
