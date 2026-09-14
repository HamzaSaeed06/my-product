"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, FileCheck2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/status-dot";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { mockAcademicYears } from "@/lib/mock/academic-years";
import { mockSections } from "@/lib/mock/sections";
import { mockClasses } from "@/lib/mock/classes";
import { mockSubjects } from "@/lib/mock/subjects";
import { mockExamSchedules, type Exam, type ExamSchedule } from "@/lib/mock/exams";
import { ScheduleDialog } from "./schedule-dialog";

export function ExamDetail({ exam }: { exam: Exam }) {
  const [status, setStatus] = useState(exam.status);
  const [schedules, setSchedules] = useState<ExamSchedule[]>(mockExamSchedules.filter((s) => s.examId === exam.id));
  const [addOpen, setAddOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

  const year = mockAcademicYears.find((y) => y.id === exam.academicYearId)?.name;

  function addSchedule(data: Omit<ExamSchedule, "id" | "examId">) {
    setSchedules((prev) => [...prev, { id: `es_${Date.now()}`, examId: exam.id, ...data }]);
    toast.success("Paper added.");
  }

  function removeSchedule(id: string) {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    toast.success("Paper removed.");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={exam.name}
        description={year}
        actions={
          <>
            <StatusDot tone={status === "PUBLISHED" ? "success" : "neutral"}>{status === "PUBLISHED" ? "Published" : "Draft"}</StatusDot>
            {status === "DRAFT" && <Button size="sm" onClick={() => setPublishOpen(true)}>Publish</Button>}
          </>
        }
      />

      <div className="flex items-center justify-between">
        <span className="label-eyebrow text-muted-foreground">Papers</span>
        <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
          <Plus className="size-3.5" />
          Add paper
        </Button>
      </div>

      {schedules.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileCheck2 />
            </EmptyMedia>
            <EmptyTitle>No papers scheduled yet</EmptyTitle>
            <EmptyDescription>Add a paper for each section and subject sitting this exam.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="surface-ring overflow-hidden rounded-[var(--card-radius)]">
          <div className="divide-y divide-border">
            {schedules.map((schedule) => {
              const section = mockSections.find((s) => s.id === schedule.sectionId);
              const className = section ? mockClasses.find((c) => c.id === section.classId)?.name : "";
              const subject = mockSubjects.find((s) => s.id === schedule.subjectId)?.name;
              return (
                <div key={schedule.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {subject} · {className} {section?.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {schedule.date} · {schedule.startTime}–{schedule.endTime}
                      {schedule.room ? ` · ${schedule.room}` : ""}
                    </span>
                  </div>
                  <Button variant="ghost" size="icon-sm" onClick={() => removeSchedule(schedule.id)} aria-label="Remove paper">
                    <Trash2 className="size-3.5 text-muted-foreground" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ScheduleDialog open={addOpen} onOpenChange={setAddOpen} onSave={addSchedule} />
      <ConfirmDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        title={`Publish "${exam.name}"?`}
        description="Makes its schedule visible to teachers, students and parents. One-way — it doesn't go back to draft."
        confirmLabel="Publish"
        successMessage="Exam published."
        onConfirm={() => setStatus("PUBLISHED")}
      />
    </div>
  );
}
