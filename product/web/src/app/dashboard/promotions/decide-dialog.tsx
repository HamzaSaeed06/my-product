"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormDialog } from "@/components/form-dialog";
import { createPromotion } from "./actions";

const DECISIONS = [
  { value: "PROMOTE", label: "Promote" },
  { value: "REPEAT", label: "Repeat" },
  { value: "PENDING", label: "Pending (re-exam)" },
  { value: "CLASS_JUMP", label: "Class jump" },
] as const;

export function DecidePromotionDialog({
  studentName,
  studentId,
  fromEnrollmentId,
  academicYearId,
  targetClassId,
  targetSectionId,
  disabled,
}: {
  studentName: string;
  studentId: string;
  fromEnrollmentId: string;
  academicYearId: string;
  targetClassId: string;
  targetSectionId: string;
  disabled: boolean;
}) {
  const [decision, setDecision] = useState<string>("PROMOTE");

  return (
    <FormDialog
      triggerLabel="Decide"
      title={`Promotion decision — ${studentName}`}
      description={disabled ? "Select a target year/class/section above first." : undefined}
      action={createPromotion}
    >
      <input type="hidden" name="studentId" value={studentId} />
      <input type="hidden" name="fromEnrollmentId" value={fromEnrollmentId} />
      <input type="hidden" name="academicYearId" value={academicYearId} />
      <input type="hidden" name="targetClassId" value={targetClassId} />
      <input type="hidden" name="targetSectionId" value={targetSectionId} />

      <div className="flex flex-col gap-2">
        <Label>Decision</Label>
        <Select name="decision" value={decision} onValueChange={(v) => v && setDecision(v)} disabled={disabled}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DECISIONS.map((d) => (
              <SelectItem key={d.value} value={d.value}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {decision === "CLASS_JUMP" ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor={`reason-${studentId}`}>Reason (required for class jump)</Label>
          <Input id={`reason-${studentId}`} name="reason" required />
        </div>
      ) : null}
    </FormDialog>
  );
}
