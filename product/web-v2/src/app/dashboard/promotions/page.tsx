"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/combobox";
import { StatusDot, type StatusTone } from "@/components/status-dot";
import { mockSections, getSectionRoster } from "@/lib/mock/sections";
import { mockClasses } from "@/lib/mock/classes";
import type { Student } from "@/lib/mock/students";
import { mockPromotions, type Promotion, type PromotionDecision, type PromotionStatus } from "@/lib/mock/promotions";
import { PromotionDialog } from "./promotion-dialog";

const SECTION_OPTIONS = mockSections
  .filter((s) => !s.archived)
  .map((s) => ({ value: s.id, label: `${mockClasses.find((c) => c.id === s.classId)?.name} ${s.name}` }));

const STATUS_TONE: Record<PromotionStatus, StatusTone> = {
  AWAITING_APPROVAL: "warning",
  AWAITING_REEXAM: "warning",
  EXECUTED: "success",
  REJECTED: "danger",
};
const STATUS_LABEL: Record<PromotionStatus, string> = {
  AWAITING_APPROVAL: "Awaiting approval",
  AWAITING_REEXAM: "Awaiting re-exam",
  EXECUTED: "Executed",
  REJECTED: "Rejected",
};

export default function PromotionsPage() {
  const [fromSectionId, setFromSectionId] = useState<string | null>("sec_2");
  const [promotions, setPromotions] = useState<Promotion[]>(mockPromotions);
  const [target, setTarget] = useState<Student | null>(null);

  const roster = fromSectionId ? getSectionRoster(fromSectionId) : [];
  const fromSection = mockSections.find((s) => s.id === fromSectionId);
  const nextClass = fromSection ? mockClasses.find((c) => c.sortOrder === (mockClasses.find((cl) => cl.id === fromSection.classId)?.sortOrder ?? 0) + 1) : null;

  function decide(decision: PromotionDecision, targetClassId: string, targetSectionId: string | null, reason: string) {
    if (!target || !fromSectionId) return;
    const status: PromotionStatus = decision === "CLASS_JUMP" ? "AWAITING_APPROVAL" : decision === "PENDING" ? "AWAITING_REEXAM" : "EXECUTED";
    const promo: Promotion = {
      id: `prom_${target.id}`,
      studentId: target.id,
      fromEnrollmentId: `enr_${target.id}`,
      fromSectionId,
      targetAcademicYearId: "ay_2026",
      targetClassId: targetClassId || (nextClass?.id ?? ""),
      targetSectionId,
      decision,
      reason: reason || null,
      status,
      decidedById: "usr_incharge_1",
      decidedAt: new Date().toISOString(),
    };
    setPromotions((prev) => (prev.some((p) => p.studentId === target.id) ? prev.map((p) => (p.studentId === target.id ? promo : p)) : [...prev, promo]));
    toast.success(status === "EXECUTED" ? "Decision recorded and enrollment updated." : status === "AWAITING_APPROVAL" ? "Sent for Campus Head approval." : "Marked pending a re-exam.");
  }

  function decideApproval(promotionId: string, approve: boolean) {
    setPromotions((prev) => prev.map((p) => (p.id === promotionId ? { ...p, status: approve ? "EXECUTED" : "REJECTED" } : p)));
    toast.success(approve ? "Class jump approved and enrollment created." : "Class jump rejected.");
  }

  const pendingApprovals = promotions.filter((p) => p.status === "AWAITING_APPROVAL" && p.fromSectionId === fromSectionId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Promotions"
        description="A manual, per-student decision at year-end — no automatic promote/retain suggestion. Promote and Repeat take effect immediately."
      />

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">From section</span>
        <Combobox options={SECTION_OPTIONS} value={fromSectionId} onChange={setFromSectionId} placeholder="Select a section" className="w-64" />
        {nextClass && <span className="text-xs text-muted-foreground">Next class: {nextClass.name}</span>}
      </div>

      {roster.length === 0 ? (
        <p className="text-sm text-muted-foreground">No students found in this section.</p>
      ) : (
        <div className="surface-ring overflow-hidden rounded-[var(--card-radius)]">
          <div className="divide-y divide-border">
            {roster.map((student) => {
              const promo = promotions.find((p) => p.studentId === student.id);
              return (
                <div key={student.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{student.fullName}</span>
                    <span className="font-mono text-xs text-muted-foreground">{student.admissionNo}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {promo ? <StatusDot tone={STATUS_TONE[promo.status]}>{STATUS_LABEL[promo.status]}</StatusDot> : <span className="text-xs text-muted-foreground">Not decided</span>}
                    <Button variant="outline" size="sm" onClick={() => setTarget(student)}>
                      Decide
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pendingApprovals.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="label-eyebrow text-muted-foreground">Pending class-jump approvals</span>
          <div className="surface-ring flex flex-col divide-y divide-border overflow-hidden rounded-[var(--card-radius)]">
            {pendingApprovals.map((promo) => {
              const student = roster.find((s) => s.id === promo.studentId);
              return (
                <div key={promo.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm text-foreground">
                      <strong className="font-medium">{student?.fullName}</strong> → {mockClasses.find((c) => c.id === promo.targetClassId)?.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{promo.reason}</span>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button variant="outline" size="sm" onClick={() => decideApproval(promo.id, false)}>Reject</Button>
                    <Button size="sm" onClick={() => decideApproval(promo.id, true)}>Approve</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <PromotionDialog student={target} defaultClassId={nextClass?.id ?? null} onOpenChange={(open) => !open && setTarget(null)} onDecide={decide} />
    </div>
  );
}
