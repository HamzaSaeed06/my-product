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
import { Combobox } from "@/components/combobox";
import { mockTeachers } from "@/lib/mock/teachers";
import { mockAppUsers } from "@/lib/mock/app-users";
import { mockSubjects } from "@/lib/mock/subjects";
import { mockSections } from "@/lib/mock/sections";
import { mockClasses } from "@/lib/mock/classes";
import { mockCampuses } from "@/lib/mock/campuses";
import { mockAcademicYears } from "@/lib/mock/academic-years";

const TEACHER_OPTIONS = mockTeachers
  .filter((t) => t.status === "ACTIVE")
  .map((t) => ({ value: t.id, label: mockAppUsers.find((u) => u.id === t.userId)?.fullName ?? t.id }));
const SUBJECT_OPTIONS = mockSubjects.filter((s) => !s.archived).map((s) => ({ value: s.id, label: s.name }));
const SECTION_OPTIONS = mockSections
  .filter((s) => !s.archived)
  .map((s) => {
    const className = mockClasses.find((c) => c.id === s.classId)?.name;
    const campusName = mockCampuses.find((c) => c.id === s.campusId)?.name;
    const yearName = mockAcademicYears.find((y) => y.id === s.academicYearId)?.name;
    return { value: s.id, label: `${className} ${s.name} · ${campusName} · ${yearName}` };
  });

// classId/academicYearId aren't picked directly — a Section already
// implies its class/campus/year, so picking one Section prevents a
// mismatch between the subject's class-level and the section's actual
// class that a separate set of dropdowns could otherwise allow.
export function AssignmentSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [sectionId, setSectionId] = useState<string | null>(null);

  const blocked = TEACHER_OPTIONS.length === 0 || SUBJECT_OPTIONS.length === 0 || SECTION_OPTIONS.length === 0;

  function handleSave() {
    onOpenChange(false);
    toast.success("Teacher assigned.");
    setTeacherId(null);
    setSubjectId(null);
    setSectionId(null);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0">
        <SheetHeader>
          <SheetTitle>Assign teacher</SheetTitle>
          <SheetDescription>Picking a section also fixes the class, campus, and academic year.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 py-2">
          {blocked ? (
            <p className="text-sm text-muted-foreground">
              Need at least one active teacher, subject, and section before an assignment can be created.
            </p>
          ) : (
            <>
              <Field>
                <FieldLabel>Teacher</FieldLabel>
                <Combobox options={TEACHER_OPTIONS} value={teacherId} onChange={setTeacherId} placeholder="Select a teacher" />
              </Field>
              <Field>
                <FieldLabel>Subject</FieldLabel>
                <Combobox options={SUBJECT_OPTIONS} value={subjectId} onChange={setSubjectId} placeholder="Select a subject" />
              </Field>
              <Field>
                <FieldLabel>Section</FieldLabel>
                <Combobox options={SECTION_OPTIONS} value={sectionId} onChange={setSectionId} placeholder="Select a section" />
              </Field>
            </>
          )}
        </div>
        <SheetFooter className="mt-auto flex-row justify-end gap-2 border-t border-border pt-4">
          <SheetClose render={<Button variant="outline" />}>Cancel</SheetClose>
          <Button onClick={handleSave} disabled={blocked || !teacherId || !subjectId || !sectionId}>
            Assign
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
