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
import { Combobox } from "@/components/combobox";
import type { Enrollment } from "@/lib/mock/enrollments";
import { mockStudents } from "@/lib/mock/students";
import { mockSections } from "@/lib/mock/sections";
import { mockClasses } from "@/lib/mock/classes";
import { mockCampuses } from "@/lib/mock/campuses";
import { mockAcademicYears } from "@/lib/mock/academic-years";

// Transferring creates a new Enrollment row and marks the current one
// Transferred — it never edits this row in place, which is what keeps a
// student's enrollment history queryable across campuses/sections.
export function TransferSheet({
  enrollment,
  open,
  onOpenChange,
}: {
  enrollment: Enrollment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [rollNumber, setRollNumber] = useState("");

  const student = mockStudents.find((s) => s.id === enrollment.studentId);
  const sectionOptions = mockSections
    .filter((s) => !s.archived && s.id !== enrollment.sectionId)
    .map((s) => {
      const className = mockClasses.find((c) => c.id === s.classId)?.name;
      const campusName = mockCampuses.find((c) => c.id === s.campusId)?.name;
      const yearName = mockAcademicYears.find((y) => y.id === s.academicYearId)?.name;
      return { value: s.id, label: `${className} ${s.name} · ${campusName} · ${yearName}` };
    });

  function handleSave() {
    onOpenChange(false);
    toast.success(`${student?.fullName} transferred.`);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0">
        <SheetHeader>
          <SheetTitle>Transfer {student?.fullName}</SheetTitle>
          <SheetDescription>Creates a new enrollment and marks the current one Transferred — history is kept, not overwritten.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 py-2">
          <Field>
            <FieldLabel>New section</FieldLabel>
            <Combobox options={sectionOptions} value={sectionId} onChange={setSectionId} placeholder="Select a section" />
          </Field>
          <Field>
            <FieldLabel htmlFor="trf-roll">Roll number (optional)</FieldLabel>
            <Input id="trf-roll" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} />
          </Field>
        </div>
        <SheetFooter className="mt-auto flex-row justify-end gap-2 border-t border-border pt-4">
          <SheetClose render={<Button variant="outline" />}>Cancel</SheetClose>
          <Button onClick={handleSave} disabled={!sectionId}>
            Transfer
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
