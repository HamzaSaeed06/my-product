"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { Student } from "@/lib/mock/students";

// Medium form tied to one row: a side Sheet, not a full-page Dialog, so the
// student list stays visible behind it and the user doesn't lose their
// place in a 200+ row table.
export function EditStudentSheet({
  student,
  open,
  onOpenChange,
}: {
  student: Student;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [fullName, setFullName] = useState(student.fullName);
  const [guardianName, setGuardianName] = useState(student.guardianName);
  const [guardianPhone, setGuardianPhone] = useState(student.guardianPhone);

  function handleSave() {
    onOpenChange(false);
    toast.success(`${fullName}'s record updated.`);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0">
        <SheetHeader>
          <SheetTitle>Edit student</SheetTitle>
          <SheetDescription>
            {student.admissionNo} &middot; {student.className} - {student.section} &middot; {student.campusName}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 py-2">
          <Field>
            <FieldLabel htmlFor="edit-full-name">Full name</FieldLabel>
            <Input id="edit-full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="edit-guardian-name">Guardian name</FieldLabel>
            <Input id="edit-guardian-name" value={guardianName} onChange={(e) => setGuardianName(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="edit-guardian-phone">Guardian phone</FieldLabel>
            <Input id="edit-guardian-phone" value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} />
          </Field>
        </div>
        <SheetFooter className="mt-auto flex-row justify-end gap-2 border-t border-border pt-4">
          <SheetClose render={<Button variant="outline" />}>Cancel</SheetClose>
          <Button onClick={handleSave}>Save changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
