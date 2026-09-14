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
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/combobox";
import { mockSections } from "@/lib/mock/sections";
import { mockClasses } from "@/lib/mock/classes";
import { mockSubjects } from "@/lib/mock/subjects";
import type { ClassDiaryEntry } from "@/lib/mock/class-diary";

const SECTION_OPTIONS = mockSections
  .filter((s) => !s.archived)
  .map((s) => ({ value: s.id, label: `${mockClasses.find((c) => c.id === s.classId)?.name} ${s.name}` }));
const SUBJECT_OPTIONS = mockSubjects.filter((s) => !s.archived).map((s) => ({ value: s.id, label: s.name }));

// Keyed by open+entry identity below so every open re-mounts this form with
// fresh initial state straight from props — avoids a setState-in-effect
// just to sync the form to whichever row (or "new") was opened.
function DiaryForm({
  entry,
  onOpenChange,
  onSave,
}: {
  entry: ClassDiaryEntry | null;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { sectionId: string; subjectId: string | null; date: string; note: string }, entryId: string | null) => void;
}) {
  const [sectionId, setSectionId] = useState<string | null>(entry?.sectionId ?? null);
  const [subjectId, setSubjectId] = useState<string | null>(entry?.subjectId ?? null);
  const [date, setDate] = useState(entry?.date ?? "2026-09-14");
  const [note, setNote] = useState(entry?.note ?? "");

  return (
    <>
      <SheetHeader>
        <SheetTitle>{entry ? "Edit diary entry" : "Add a diary entry"}</SheetTitle>
        <SheetDescription>A short daily log for a section — lighter than Homework, no draft/publish step.</SheetDescription>
      </SheetHeader>
      <div className="flex flex-col gap-4 overflow-y-auto px-4 py-2">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel>Section</FieldLabel>
            <Combobox options={SECTION_OPTIONS} value={sectionId} onChange={setSectionId} placeholder="Select" />
          </Field>
          <Field>
            <FieldLabel htmlFor="diary-date">Date</FieldLabel>
            <Input id="diary-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        <Field>
          <FieldLabel>Subject (optional)</FieldLabel>
          <Combobox options={SUBJECT_OPTIONS} value={subjectId} onChange={setSubjectId} placeholder="Not subject-specific" />
        </Field>
        <Field>
          <FieldLabel htmlFor="diary-note">Note</FieldLabel>
          <Textarea id="diary-note" rows={5} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
      <SheetFooter className="mt-auto flex-row justify-end gap-2 border-t border-border pt-4">
        <SheetClose render={<Button variant="outline" />}>Cancel</SheetClose>
        <Button
          disabled={!sectionId || !note.trim()}
          onClick={() => {
            if (!sectionId) return;
            onSave({ sectionId, subjectId, date, note: note.trim() }, entry?.id ?? null);
            onOpenChange(false);
            toast.success(entry ? "Diary entry updated." : "Diary entry added.");
          }}
        >
          {entry ? "Save" : "Add entry"}
        </Button>
      </SheetFooter>
    </>
  );
}

export function DiarySheet({
  entry,
  open,
  onOpenChange,
  onSave,
}: {
  entry: ClassDiaryEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { sectionId: string; subjectId: string | null; date: string; note: string }, entryId: string | null) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0">
        <DiaryForm key={`${open}-${entry?.id ?? "new"}`} entry={entry} onOpenChange={onOpenChange} onSave={onSave} />
      </SheetContent>
    </Sheet>
  );
}
