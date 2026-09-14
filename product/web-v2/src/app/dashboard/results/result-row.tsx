"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusDot, type StatusTone } from "@/components/status-dot";
import { mockSubjects } from "@/lib/mock/subjects";
import type { Student } from "@/lib/mock/students";
import type { Result, ResultItem, ResultStatus } from "@/lib/mock/results";
import { MarksDialog } from "./marks-dialog";

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

export function ResultRow({
  student,
  result,
  items,
  onAdvance,
  onSaveMarks,
}: {
  student: Student;
  result: Result;
  items: ResultItem[];
  onAdvance: (resultId: string) => void;
  onSaveMarks: (resultId: string, marks: Record<string, number | null>) => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const nextAction = NEXT_ACTION_LABEL[result.status];
  const total = items.reduce((sum, i) => sum + (i.marksObtained ?? 0), 0);
  const maxTotal = items.reduce((sum, i) => sum + i.maxMarks, 0);

  return (
    <div className="flex flex-col gap-2 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">{student.fullName}</span>
          <span className="font-mono text-xs text-muted-foreground">{student.admissionNo}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-foreground">
            {total} / {maxTotal}
          </span>
          <StatusDot tone={STAGE_TONE[result.status]}>{STAGE_LABEL[result.status]}</StatusDot>
          {result.status === "DRAFT" && (
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              Enter marks
            </Button>
          )}
          {nextAction && (
            <Button size="sm" onClick={() => onAdvance(result.id)}>
              {nextAction}
            </Button>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 pl-0">
        {items.map((item) => (
          <span key={item.id} className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
            {mockSubjects.find((s) => s.id === item.subjectId)?.name}: {item.marksObtained ?? "—"}
          </span>
        ))}
      </div>

      <MarksDialog
        studentName={student.fullName}
        items={items}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={(marks) => onSaveMarks(result.id, marks)}
      />
    </div>
  );
}
