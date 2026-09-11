"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormDialog } from "@/components/form-dialog";
import { createFeeStructure } from "./actions";

interface NamedOption {
  id: string;
  name: string;
}

const FREQUENCIES = ["MONTHLY", "ANNUAL", "ONE_TIME"] as const;

export function CreateStructureDialog({
  instituteId,
  classes,
  categories,
}: {
  instituteId: string;
  classes: NamedOption[];
  categories: NamedOption[];
}) {
  const disabled = classes.length === 0 || categories.length === 0;

  return (
    <FormDialog
      triggerLabel="+ Add fee structure"
      title="Create a fee structure"
      description={disabled ? "Need at least one class and one fee category first." : undefined}
      action={createFeeStructure}
    >
      <input type="hidden" name="instituteId" value={instituteId} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="fs-class">Class</Label>
        <Select name="classId" disabled={disabled}>
          <SelectTrigger id="fs-class" className="w-full">
            <SelectValue placeholder="Select a class" />
          </SelectTrigger>
          <SelectContent>
            {classes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="fs-category">Fee category</Label>
        <Select name="feeCategoryId" disabled={disabled}>
          <SelectTrigger id="fs-category" className="w-full">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="fs-name">Name</Label>
        <Input id="fs-name" name="name" required placeholder="e.g. Class 5 Tuition" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="fs-amount">Amount</Label>
          <Input id="fs-amount" name="amount" required placeholder="5000.00" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="fs-frequency">Frequency</Label>
          <Select name="frequency" defaultValue="MONTHLY">
            <SelectTrigger id="fs-frequency" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCIES.map((f) => (
                <SelectItem key={f} value={f}>
                  {f[0]}
                  {f.slice(1).toLowerCase().replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="fs-effective">Effective from</Label>
        <Input id="fs-effective" name="effectiveFrom" type="date" required />
      </div>
    </FormDialog>
  );
}
