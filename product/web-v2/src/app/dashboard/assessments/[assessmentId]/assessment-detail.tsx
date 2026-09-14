"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusDot } from "@/components/status-dot";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { getSectionRoster } from "@/lib/mock/sections";
import { mockSubjects } from "@/lib/mock/subjects";
import { mockSections } from "@/lib/mock/sections";
import { mockClasses } from "@/lib/mock/classes";
import {
  mockAssessmentMarks,
  mockAssessmentCorrections,
  type Assessment,
  type AssessmentMark,
  type AssessmentCorrectionRequest,
} from "@/lib/mock/assessments";
import { MarksCorrectionDialog } from "./correction-dialog";

export function AssessmentDetail({ assessment }: { assessment: Assessment }) {
  const [status, setStatus] = useState(assessment.status);
  const [marks, setMarks] = useState<AssessmentMark[]>(mockAssessmentMarks.filter((m) => m.assessmentId === assessment.id));
  const [corrections, setCorrections] = useState<AssessmentCorrectionRequest[]>(mockAssessmentCorrections);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [correctionTarget, setCorrectionTarget] = useState<AssessmentMark | null>(null);

  const roster = getSectionRoster(assessment.sectionId);
  const subject = mockSubjects.find((s) => s.id === assessment.subjectId)?.name;
  const section = mockSections.find((s) => s.id === assessment.sectionId);
  const className = mockClasses.find((c) => c.id === assessment.classId)?.name;
  const isDraft = status === "DRAFT";

  function updateMark(studentId: string, field: "marksObtained" | "remarks", value: string) {
    setMarks((prev) =>
      prev.map((m) =>
        m.studentId === studentId
          ? { ...m, [field]: field === "marksObtained" ? (value === "" ? null : Number(value)) : value }
          : m,
      ),
    );
  }

  function requestCorrection(requestedMarks: number, reason: string) {
    if (!correctionTarget) return;
    setCorrections((prev) => [
      ...prev,
      {
        id: `amc_${Date.now()}`,
        assessmentMarkId: correctionTarget.id,
        requestedMarks,
        reason,
        status: "PENDING",
        requestedById: "usr_teacher_1",
        requestedAt: new Date().toISOString(),
        decidedById: null,
        decidedAt: null,
      },
    ]);
    toast.success("Correction request sent for approval.");
  }

  function decideCorrection(correctionId: string, approve: boolean) {
    const correction = corrections.find((c) => c.id === correctionId);
    if (!correction) return;
    setCorrections((prev) =>
      prev.map((c) => (c.id === correctionId ? { ...c, status: approve ? "APPROVED" : "REJECTED", decidedById: "usr_incharge_1", decidedAt: new Date().toISOString() } : c)),
    );
    if (approve) {
      setMarks((prev) => prev.map((m) => (m.id === correction.assessmentMarkId ? { ...m, marksObtained: correction.requestedMarks } : m)));
    }
    toast.success(approve ? "Correction approved." : "Correction rejected.");
  }

  const pendingCorrections = corrections.filter((c) => c.status === "PENDING" && marks.some((m) => m.id === c.assessmentMarkId));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={assessment.title}
        description={`${subject} · ${className} ${section?.name ?? ""} · Out of ${assessment.maxMarks} · ${assessment.date}`}
        actions={
          <>
            <StatusDot tone={status === "SUBMITTED" ? "success" : "neutral"}>{status === "SUBMITTED" ? "Submitted" : "Draft"}</StatusDot>
            {isDraft && <Button size="sm" onClick={() => setSubmitOpen(true)}>Submit</Button>}
          </>
        }
      />

      <div className="surface-ring overflow-hidden rounded-[var(--card-radius)]">
        <div className="divide-y divide-border">
          {roster.map((student) => {
            const mark = marks.find((m) => m.studentId === student.id);
            const pending = pendingCorrections.some((c) => c.assessmentMarkId === mark?.id);
            return (
              <div key={student.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{student.fullName}</span>
                  <span className="font-mono text-xs text-muted-foreground">{student.admissionNo}</span>
                </div>
                {isDraft ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={assessment.maxMarks}
                      className="w-20"
                      value={mark?.marksObtained ?? ""}
                      onChange={(e) => updateMark(student.id, "marksObtained", e.target.value)}
                    />
                    <Input
                      placeholder="Remarks (optional)"
                      className="w-48"
                      value={mark?.remarks ?? ""}
                      onChange={(e) => updateMark(student.id, "remarks", e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-foreground">
                      {mark?.marksObtained ?? "—"} / {assessment.maxMarks}
                    </span>
                    <Button variant="ghost" size="sm" disabled={pending} onClick={() => mark && setCorrectionTarget(mark)}>
                      {pending ? "Correction pending" : "Request correction"}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {pendingCorrections.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="label-eyebrow text-muted-foreground">Pending corrections</span>
          <div className="surface-ring flex flex-col divide-y divide-border overflow-hidden rounded-[var(--card-radius)]">
            {pendingCorrections.map((correction) => {
              const mark = marks.find((m) => m.id === correction.assessmentMarkId);
              const student = roster.find((s) => s.id === mark?.studentId);
              return (
                <div key={correction.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm text-foreground">
                      <strong className="font-medium">{student?.fullName}</strong> → {correction.requestedMarks} marks
                    </span>
                    <span className="text-xs text-muted-foreground">{correction.reason}</span>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button variant="outline" size="sm" onClick={() => decideCorrection(correction.id, false)}>Reject</Button>
                    <Button size="sm" onClick={() => decideCorrection(correction.id, true)}>Approve</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <MarksCorrectionDialog
        mark={correctionTarget}
        studentName={correctionTarget ? roster.find((s) => s.id === correctionTarget.studentId)?.fullName ?? "" : ""}
        onOpenChange={(open) => !open && setCorrectionTarget(null)}
        onSubmit={requestCorrection}
      />
      <ConfirmDialog
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        title="Submit this assessment?"
        description="Locks all marks — from here, any change goes through an Incharge's correction approval instead of a direct edit."
        confirmLabel="Submit"
        successMessage="Assessment submitted."
        onConfirm={() => setStatus("SUBMITTED")}
      />
    </div>
  );
}
