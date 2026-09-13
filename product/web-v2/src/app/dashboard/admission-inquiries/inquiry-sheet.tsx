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
import { mockCampuses } from "@/lib/mock/campuses";
import { mockClasses } from "@/lib/mock/classes";

const CAMPUS_OPTIONS = mockCampuses.map((c) => ({ value: c.id, label: c.name }));
const CLASS_OPTIONS = mockClasses.filter((c) => !c.archived).map((c) => ({ value: c.id, label: c.name }));

// A lead intake form — few fields, no student/parent resolution here
// (that heavier work happens later, only if/when this inquiry converts).
export function InquirySheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [campusId, setCampusId] = useState<string | null>(null);
  const [classId, setClassId] = useState<string | null>(null);
  const [childName, setChildName] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");

  function handleSave() {
    onOpenChange(false);
    toast.success(`Inquiry logged for ${childName}.`);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0">
        <SheetHeader>
          <SheetTitle>New admission inquiry</SheetTitle>
          <SheetDescription>A lead before a formal application — convert it later once the family is ready.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 py-2">
          <Field>
            <FieldLabel>Campus</FieldLabel>
            <Combobox options={CAMPUS_OPTIONS} value={campusId} onChange={setCampusId} placeholder="Select a campus" />
          </Field>
          <Field>
            <FieldLabel>Class (optional)</FieldLabel>
            <Combobox options={CLASS_OPTIONS} value={classId} onChange={setClassId} placeholder="Not sure yet" />
          </Field>
          <Field>
            <FieldLabel htmlFor="inq-child">Child&apos;s name</FieldLabel>
            <Input id="inq-child" value={childName} onChange={(e) => setChildName(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="inq-parent">Parent&apos;s name</FieldLabel>
            <Input id="inq-parent" value={parentName} onChange={(e) => setParentName(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="inq-phone">Phone</FieldLabel>
              <Input id="inq-phone" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="inq-email">Email (optional)</FieldLabel>
              <Input id="inq-email" type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="inq-source">Source (optional)</FieldLabel>
            <Input id="inq-source" placeholder="Walk-in / Referral / Website" value={source} onChange={(e) => setSource(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="inq-notes">Notes (optional)</FieldLabel>
            <Textarea id="inq-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </div>
        <SheetFooter className="mt-auto flex-row justify-end gap-2 border-t border-border pt-4">
          <SheetClose render={<Button variant="outline" />}>Cancel</SheetClose>
          <Button onClick={handleSave} disabled={!campusId || !childName || !parentName || !parentPhone}>
            Log inquiry
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
