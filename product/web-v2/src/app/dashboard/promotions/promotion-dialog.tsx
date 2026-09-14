"use client";

import { useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/combobox";
import { mockClasses } from "@/lib/mock/classes";
import { mockSections } from "@/lib/mock/sections";
import type { Student } from "@/lib/mock/students";
import type { PromotionDecision } from "@/lib/mock/promotions";

const DECISION_LABEL: Record<PromotionDecision, string> = {
  PROMOTE: "Promote",
  REPEAT: "Repeat year",
  CLASS_JUMP: "Class jump",
  PENDING: "Pending (re-exam)",
};

export function PromotionDialog({
  student,
  defaultClassId,
  onOpenChange,
  onDecide,
}: {
  student: Student | null;
  defaultClassId: string | null;
  onOpenChange: (open: boolean) => void;
  onDecide: (decision: PromotionDecision, targetClassId: string, targetSectionId: string | null, reason: string) => void;
}) {
  const [decision, setDecision] = useState<PromotionDecision>("PROMOTE");
  const [targetClassId, setTargetClassId] = useState<string | null>(defaultClassId);
  const [targetSectionId, setTargetSectionId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const CLASS_OPTIONS = mockClasses.filter((c) => !c.archived).map((c) => ({ value: c.id, label: c.name }));
  const SECTION_OPTIONS = mockSections
    .filter((s) => !s.archived && s.classId === targetClassId)
    .map((s) => ({ value: s.id, label: `Section ${s.name}` }));

  function reset() {
    setDecision("PROMOTE");
    setTargetClassId(defaultClassId);
    setTargetSectionId(null);
    setReason("");
  }

  return (
    <Dialog
      open={!!student}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Promotion decision — {student?.fullName}</DialogTitle>
          <DialogDescription>Promote and Repeat take effect immediately. Class jump needs a Campus Head&apos;s approval first.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel>Decision</FieldLabel>
            <Select value={decision} onValueChange={(v) => setDecision(v as PromotionDecision)}>
              <SelectTrigger className="w-full">
                <SelectValue>{(value) => DECISION_LABEL[value as PromotionDecision]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(DECISION_LABEL) as PromotionDecision[]).map((d) => (
                  <SelectItem key={d} value={d}>
                    {DECISION_LABEL[d]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {(decision === "PROMOTE" || decision === "CLASS_JUMP") && (
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel>Target class</FieldLabel>
                <Combobox options={CLASS_OPTIONS} value={targetClassId} onChange={setTargetClassId} placeholder="Select" />
              </Field>
              <Field>
                <FieldLabel>Target section (optional)</FieldLabel>
                <Combobox options={SECTION_OPTIONS} value={targetSectionId} onChange={setTargetSectionId} placeholder="Not yet assigned" />
              </Field>
            </div>
          )}
          {decision === "CLASS_JUMP" && (
            <Field>
              <FieldLabel htmlFor="promo-reason">Reason (required for approval)</FieldLabel>
              <Textarea id="promo-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
            </Field>
          )}
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            disabled={(decision === "PROMOTE" || decision === "CLASS_JUMP") && !targetClassId ? true : decision === "CLASS_JUMP" && !reason.trim()}
            onClick={() => {
              onDecide(decision, targetClassId ?? "", targetSectionId, reason.trim());
              onOpenChange(false);
              reset();
            }}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
