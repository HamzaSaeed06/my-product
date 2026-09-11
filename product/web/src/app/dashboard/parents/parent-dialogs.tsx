"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormDialog } from "@/components/form-dialog";
import { createParent, linkChild } from "./actions";

export function CreateParentDialog() {
  return (
    <FormDialog triggerLabel="+ Add parent" title="Add parent/guardian" action={createParent}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="address">Address</Label>
        <Input id="address" name="address" />
      </div>
    </FormDialog>
  );
}

export function LinkChildDialog({
  parentId,
  students,
}: {
  parentId: string;
  students: { id: string; studentCode: string; fullName: string }[];
}) {
  const disabled = students.length === 0;

  return (
    <FormDialog
      triggerLabel="+ Link child"
      title="Link a child"
      description={disabled ? "No students exist yet — create one first." : undefined}
      action={(formData) => linkChild(parentId, formData)}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="studentId">Student</Label>
        <Select name="studentId" disabled={disabled}>
          <SelectTrigger id="studentId" className="w-full">
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
        <Label htmlFor="relationship">Relationship</Label>
        <Input id="relationship" name="relationship" placeholder="e.g. Father, Mother, Guardian" disabled={disabled} />
      </div>
    </FormDialog>
  );
}
