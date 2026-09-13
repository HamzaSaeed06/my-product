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
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/combobox";
import type { Section } from "@/lib/mock/sections";
import { mockClasses } from "@/lib/mock/classes";
import { mockCampuses } from "@/lib/mock/campuses";
import { mockAcademicYears } from "@/lib/mock/academic-years";

const CLASS_OPTIONS = mockClasses.filter((c) => !c.archived).map((c) => ({ value: c.id, label: c.name }));
const CAMPUS_OPTIONS = mockCampuses.map((c) => ({ value: c.id, label: c.name }));
const YEAR_OPTIONS = mockAcademicYears.filter((y) => y.status === "ACTIVE").map((y) => ({ value: y.id, label: y.name }));

// Class, Campus, and Academic Year are immutable once a Section exists —
// the real backend refuses to change them after create — so the edit path
// shows them as plain read-only facts, not disabled pickers pretending to
// be editable.
export function SectionSheet({
  section,
  open,
  onOpenChange,
}: {
  section?: Section;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState(section?.name ?? "");
  const [capacity, setCapacity] = useState(section?.capacity != null ? String(section.capacity) : "");
  const [classId, setClassId] = useState<string | null>(section?.classId ?? null);
  const [campusId, setCampusId] = useState<string | null>(section?.campusId ?? null);
  const [academicYearId, setAcademicYearId] = useState<string | null>(section?.academicYearId ?? null);
  const isEdit = !!section;

  function handleSave() {
    onOpenChange(false);
    toast.success(isEdit ? `Section ${name} updated.` : `Section ${name} created.`);
  }

  const className = mockClasses.find((c) => c.id === section?.classId)?.name;
  const campusName = mockCampuses.find((c) => c.id === section?.campusId)?.name;
  const yearName = mockAcademicYears.find((y) => y.id === section?.academicYearId)?.name;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit section" : "New section"}</SheetTitle>
          <SheetDescription>
            The actual campus + academic-year instance of a class — this is what students enroll into.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 py-2">
          {isEdit ? (
            <Field>
              <FieldLabel>Class · Campus · Academic year</FieldLabel>
              <p className="text-sm text-foreground">
                {className} · {campusName} · {yearName}
              </p>
              <FieldDescription>Fixed at creation — not editable afterward.</FieldDescription>
            </Field>
          ) : (
            <>
              <Field>
                <FieldLabel>Class</FieldLabel>
                <Combobox options={CLASS_OPTIONS} value={classId} onChange={setClassId} placeholder="Select a class" />
              </Field>
              <Field>
                <FieldLabel>Campus</FieldLabel>
                <Combobox options={CAMPUS_OPTIONS} value={campusId} onChange={setCampusId} placeholder="Select a campus" />
              </Field>
              <Field>
                <FieldLabel>Academic year</FieldLabel>
                <Combobox options={YEAR_OPTIONS} value={academicYearId} onChange={setAcademicYearId} placeholder="Select a year" />
              </Field>
            </>
          )}
          <Field>
            <FieldLabel htmlFor="sec-name">Name</FieldLabel>
            <Input id="sec-name" placeholder="A" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="sec-capacity">Capacity</FieldLabel>
            <Input id="sec-capacity" type="number" placeholder="Optional" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          </Field>
        </div>
        <SheetFooter className="mt-auto flex-row justify-end gap-2 border-t border-border pt-4">
          <SheetClose render={<Button variant="outline" />}>Cancel</SheetClose>
          <Button onClick={handleSave} disabled={!name || (!isEdit && (!classId || !campusId || !academicYearId))}>
            {isEdit ? "Save changes" : "Create section"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
