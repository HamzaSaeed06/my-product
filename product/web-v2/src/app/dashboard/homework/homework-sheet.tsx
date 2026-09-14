"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
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
import { mockSubjects } from "@/lib/mock/subjects";
import { mockSections } from "@/lib/mock/sections";
import { mockClasses } from "@/lib/mock/classes";

const SUBJECT_OPTIONS = mockSubjects.filter((s) => !s.archived).map((s) => ({ value: s.id, label: s.name }));
const SECTION_OPTIONS = mockSections
  .filter((s) => !s.archived)
  .map((s) => ({ value: s.id, label: `${mockClasses.find((c) => c.id === s.classId)?.name} ${s.name}` }));

export function HomeworkSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [files, setFiles] = useState<string[]>([]);

  function reset() {
    setTitle("");
    setDescription("");
    setSectionId(null);
    setSubjectId(null);
    setDueDate("");
    setFiles([]);
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
          <SheetTitle>Create homework</SheetTitle>
          <SheetDescription>Saved as a draft — publish it separately once it&apos;s ready for students to see.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 py-2">
          <Field>
            <FieldLabel htmlFor="hw-title">Title</FieldLabel>
            <Input id="hw-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Section</FieldLabel>
              <Combobox options={SECTION_OPTIONS} value={sectionId} onChange={setSectionId} placeholder="Select" />
            </Field>
            <Field>
              <FieldLabel>Subject</FieldLabel>
              <Combobox options={SUBJECT_OPTIONS} value={subjectId} onChange={setSubjectId} placeholder="Select" />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="hw-due">Due date</FieldLabel>
            <Input id="hw-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="hw-desc">Description (optional)</FieldLabel>
            <Textarea id="hw-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="hw-files">Attachments (up to 10 files, optional)</FieldLabel>
            <Input
              id="hw-files"
              type="file"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files ?? []).map((f) => f.name))}
            />
            {files.length > 0 && (
              <ul className="flex flex-col gap-1">
                {files.map((name) => (
                  <li key={name} className="flex items-center justify-between gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs">
                    <span className="truncate text-foreground">{name}</span>
                    <button type="button" onClick={() => setFiles((prev) => prev.filter((f) => f !== name))} aria-label={`Remove ${name}`}>
                      <X className="size-3 text-muted-foreground" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Field>
        </div>
        <SheetFooter className="mt-auto flex-row justify-end gap-2 border-t border-border pt-4">
          <SheetClose render={<Button variant="outline" />}>Cancel</SheetClose>
          <Button
            disabled={!title.trim() || !sectionId || !subjectId || !dueDate}
            onClick={() => {
              onOpenChange(false);
              toast.success("Homework saved as draft.");
              reset();
            }}
          >
            Save draft
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
