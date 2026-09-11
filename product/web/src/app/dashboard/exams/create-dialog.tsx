"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormDialog } from "@/components/form-dialog";
import { createExam } from "./actions";

interface NamedOption {
  id: string;
  name: string;
}

export function CreateExamDialog({ academicYears }: { academicYears: NamedOption[] }) {
  const disabled = academicYears.length === 0;

  return (
    <FormDialog
      triggerLabel="+ Add exam"
      title="Create an exam"
      description={disabled ? "Create an academic year first." : undefined}
      action={createExam}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="exam-year">Academic year</Label>
        <Select name="academicYearId" disabled={disabled}>
          <SelectTrigger id="exam-year" className="w-full">
            <SelectValue placeholder="Select an academic year" />
          </SelectTrigger>
          <SelectContent>
            {academicYears.map((y) => (
              <SelectItem key={y.id} value={y.id}>
                {y.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="exam-name">Name</Label>
        <Input id="exam-name" name="name" required placeholder="e.g. Midterm" />
      </div>
    </FormDialog>
  );
}
