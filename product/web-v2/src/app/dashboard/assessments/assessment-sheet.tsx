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
import { mockSubjects } from "@/lib/mock/subjects";
import { mockSections } from "@/lib/mock/sections";
import { mockClasses } from "@/lib/mock/classes";

const SUBJECT_OPTIONS = mockSubjects.filter((s) => !s.archived).map((s) => ({ value: s.id, label: s.name }));
const SECTION_OPTIONS = mockSections
  .filter((s) => !s.archived)
  .map((s) => ({ value: s.id, label: `${mockClasses.find((c) => c.id === s.classId)?.name} ${s.name}` }));

export function AssessmentSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [title, setTitle] = useState("");
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [maxMarks, setMaxMarks] = useState("20");
  const [date, setDate] = useState("2026-09-14");

  function reset() {
    setTitle("");
    setSectionId(null);
    setSubjectId(null);
    setMaxMarks("20");
    setDate("2026-09-14");
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <SheetContent className="flex flex-col gap-0">
        <SheetHeader>
          <SheetTitle>Create an assessment</SheetTitle>
          <SheetDescription>An internal, teacher-run check — quiz, class test, or similar. Marks are entered from its own page next.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 py-2">
          <Field>
            <FieldLabel htmlFor="as-title">Title</FieldLabel>
            <Input id="as-title" placeholder="e.g. Quiz 1 — Fractions" value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel>Section</FieldLabel>
              <Combobox options={SECTION_OPTIONS} value={sectionId} onChange={setSectionId} placeholder="Select" />
            </Field>
            <Field>
              <FieldLabel>Subject</FieldLabel>
              <Combobox options={SUBJECT_OPTIONS} value={subjectId} onChange={setSubjectId} placeholder="Select" />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="as-max">Max marks</FieldLabel>
              <Input id="as-max" type="number" min={1} value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="as-date">Date</FieldLabel>
              <Input id="as-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
          </div>
        </div>
        <SheetFooter className="mt-auto flex-row justify-end gap-2 border-t border-border pt-4">
          <SheetClose render={<Button variant="outline" />}>Cancel</SheetClose>
          <Button
            disabled={!title.trim() || !sectionId || !subjectId}
            onClick={() => {
              onOpenChange(false);
              toast.success("Assessment created — enter marks from its page.");
              reset();
            }}
          >
            Create
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
