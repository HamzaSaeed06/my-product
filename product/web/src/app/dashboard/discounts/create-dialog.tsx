"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormDialog } from "@/components/form-dialog";
import { createDiscount } from "./actions";

interface StudentOption {
  id: string;
  fullName: string;
  studentCode: string;
}

const TYPES = ["SIBLING", "MERIT", "STAFF", "OTHER"] as const;
const MODES = ["amount", "percentage"] as const;

export function CreateDiscountDialog({ students }: { students: StudentOption[] }) {
  const disabled = students.length === 0;
  const [mode, setMode] = useState<(typeof MODES)[number]>("percentage");

  return (
    <FormDialog
      triggerLabel="+ Request discount"
      title="Request a discount"
      description={disabled ? "Need at least one student first." : undefined}
      action={createDiscount}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="disc-student">Student</Label>
        <Select name="studentId" disabled={disabled}>
          <SelectTrigger id="disc-student" className="w-full">
            <SelectValue placeholder="Select a student" />
          </SelectTrigger>
          <SelectContent>
            {students.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.fullName} ({s.studentCode})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="disc-type">Type</Label>
        <Select name="type" defaultValue="MERIT">
          <SelectTrigger id="disc-type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t[0]}
                {t.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Discount as</Label>
        <Select value={mode} onValueChange={(v) => v && setMode(v as (typeof MODES)[number])}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="percentage">Percentage</SelectItem>
            <SelectItem value="amount">Flat amount</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {mode === "percentage" ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="disc-percentage">Percentage</Label>
          <Input id="disc-percentage" name="percentage" required placeholder="e.g. 15.00" />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Label htmlFor="disc-amount">Amount</Label>
          <Input id="disc-amount" name="amount" required placeholder="e.g. 500.00" />
        </div>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="disc-reason">Reason</Label>
        <Input id="disc-reason" name="reason" required />
      </div>
    </FormDialog>
  );
}
