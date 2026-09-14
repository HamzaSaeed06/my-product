"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusDot, type StatusTone } from "@/components/status-dot";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { mockExams } from "@/lib/mock/exams";
import { mockSections } from "@/lib/mock/sections";
import { mockClasses } from "@/lib/mock/classes";
import { mockSubjects } from "@/lib/mock/subjects";
import { getStudentById } from "@/lib/mock/students";
import { mockResultItems, RESULT_STAGE_ORDER, type Result, type ResultItem, type ResultStatus } from "@/lib/mock/results";

const STAGE_TONE: Record<ResultStatus, StatusTone> = {
  DRAFT: "neutral",
  SUBMITTED: "warning",
  REVIEWED: "warning",
  FINALIZED: "success",
  PUBLISHED: "success",
};

const STAGE_LABEL: Record<ResultStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  REVIEWED: "Reviewed",
  FINALIZED: "Finalized",
  PUBLISHED: "Published",
};

const NEXT_ACTION_LABEL: Partial<Record<ResultStatus, string>> = {
  DRAFT: "Submit",
  SUBMITTED: "Mark reviewed",
  REVIEWED: "Finalize",
  FINALIZED: "Publish",
};

export function ResultDetail({ result }: { result: Result }) {
  const [status, setStatus] = useState(result.status);
  const [items, setItems] = useState<ResultItem[]>(mockResultItems.filter((i) => i.resultId === result.id));
  const [advanceOpen, setAdvanceOpen] = useState(false);

  const student = getStudentById(result.studentId);
  const exam = mockExams.find((e) => e.id === result.examId);
  const section = mockSections.find((s) => s.id === result.sectionId);
  const className = section ? mockClasses.find((c) => c.id === section.classId)?.name : "";
  const isDraft = status === "DRAFT";
  const nextAction = NEXT_ACTION_LABEL[status];
  const total = items.reduce((sum, i) => sum + (i.marksObtained ?? 0), 0);
  const maxTotal = items.reduce((sum, i) => sum + i.maxMarks, 0);

  function updateMark(itemId: string, value: string) {
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, marksObtained: value === "" ? null : Number(value) } : i)));
  }

  function saveMarks() {
    toast.success("Marks saved.");
  }

  function advance() {
    const nextIndex = RESULT_STAGE_ORDER.indexOf(status) + 1;
    if (nextIndex < RESULT_STAGE_ORDER.length) setStatus(RESULT_STAGE_ORDER[nextIndex]);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={student?.fullName ?? result.studentId}
        description={`${exam?.name} · ${className} ${section?.name ?? ""} · ${student?.admissionNo}`}
        actions={
          <>
            <StatusDot tone={STAGE_TONE[status]}>{STAGE_LABEL[status]}</StatusDot>
            {nextAction && (
              <Button size="sm" onClick={() => setAdvanceOpen(true)}>
                {nextAction}
              </Button>
            )}
          </>
        }
      />

      <div className="surface-ring overflow-hidden rounded-[var(--card-radius)]">
        <div className="divide-y divide-border">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span className="text-sm font-medium text-foreground">{mockSubjects.find((s) => s.id === item.subjectId)?.name}</span>
              {isDraft ? (
                <div className="flex items-center gap-2">
                  <Input type="number" min={0} max={item.maxMarks} className="w-24" value={item.marksObtained ?? ""} onChange={(e) => updateMark(item.id, e.target.value)} />
                  <span className="text-xs text-muted-foreground">/ {item.maxMarks}</span>
                </div>
              ) : (
                <span className="font-mono text-sm text-foreground">
                  {item.marksObtained ?? "—"} / {item.maxMarks}
                </span>
              )}
            </div>
          ))}
          <div className="flex items-center justify-between bg-muted/40 px-4 py-2.5">
            <span className="text-sm font-medium text-foreground">Total</span>
            <span className="font-mono text-sm font-medium text-foreground">
              {total} / {maxTotal}
            </span>
          </div>
        </div>
      </div>

      {isDraft && (
        <div className="flex justify-end">
          <Button size="sm" onClick={saveMarks}>
            Save marks
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={advanceOpen}
        onOpenChange={setAdvanceOpen}
        title={`${nextAction} this result?`}
        description={
          status === "DRAFT"
            ? "Locks marks entry — from here, any change goes through a correction approval instead of a direct edit."
            : "Moves this result to its next stage in the pipeline."
        }
        confirmLabel={nextAction ?? "Confirm"}
        successMessage="Result advanced to the next stage."
        onConfirm={advance}
      />
    </div>
  );
}
