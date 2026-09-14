"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { mockAssessments } from "@/lib/mock/assessments";
import { assessmentColumns } from "./columns";
import { AssessmentSheet } from "./assessment-sheet";

export default function AssessmentsPage() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Assessments"
        description="Internal, teacher-run checks — quizzes and class tests. A separate, independently-locked system from Exams and Results."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" />
            Create assessment
          </Button>
        }
      />
      <DataTable
        columns={assessmentColumns}
        data={mockAssessments.filter((a) => !a.archivedAt)}
        emptyTitle="No assessments yet"
        emptyDescription="Create one for a section and subject to start entering marks."
      />
      <AssessmentSheet open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
