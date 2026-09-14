"use client";

import { useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Combobox } from "@/components/combobox";
import { mockSubjects } from "@/lib/mock/subjects";
import { mockTeachers } from "@/lib/mock/teachers";
import { mockAppUsers } from "@/lib/mock/app-users";
import { DAY_LABELS, type DayOfWeek } from "@/lib/mock/timetable";

const SUBJECT_OPTIONS = mockSubjects.filter((s) => !s.archived).map((s) => ({ value: s.id, label: s.name }));
const TEACHER_OPTIONS = mockTeachers
  .filter((t) => t.status === "ACTIVE")
  .map((t) => ({ value: t.id, label: mockAppUsers.find((u) => u.id === t.userId)?.fullName ?? t.id }));

export interface EntrySlot {
  day: DayOfWeek;
  period: number;
  subjectId: string | null;
  teacherId: string | null;
  /** null when adding a brand-new entry into an empty slot. */
  entryId: string | null;
}

// Keyed by the slot's own identity below so each open re-mounts this form
// with fresh initial state straight from props — avoids a setState-in-
// effect just to sync the form to whichever cell was clicked.
function EntryForm({
  slot,
  onOpenChange,
  onSave,
  onRemove,
}: {
  slot: EntrySlot;
  onOpenChange: (open: boolean) => void;
  onSave: (day: DayOfWeek, period: number, subjectId: string, teacherId: string, entryId: string | null) => void;
  onRemove: (entryId: string) => void;
}) {
  const [subjectId, setSubjectId] = useState<string | null>(slot.subjectId);
  const [teacherId, setTeacherId] = useState<string | null>(slot.teacherId);

  return (
    <>
      <DialogHeader>
        <DialogTitle>{slot.entryId ? "Edit period" : "Add period"}</DialogTitle>
        <DialogDescription>
          {DAY_LABELS[slot.day]} · Period {slot.period}
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        <Field>
          <FieldLabel>Subject</FieldLabel>
          <Combobox options={SUBJECT_OPTIONS} value={subjectId} onChange={setSubjectId} placeholder="Select a subject" />
        </Field>
        <Field>
          <FieldLabel>Teacher</FieldLabel>
          <Combobox options={TEACHER_OPTIONS} value={teacherId} onChange={setTeacherId} placeholder="Select a teacher" />
        </Field>
      </div>
      <DialogFooter className="items-center sm:justify-between">
        {slot.entryId ? (
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              onRemove(slot.entryId!);
              onOpenChange(false);
            }}
          >
            Remove
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            disabled={!subjectId || !teacherId}
            onClick={() => {
              if (!subjectId || !teacherId) return;
              onSave(slot.day, slot.period, subjectId, teacherId, slot.entryId);
              onOpenChange(false);
            }}
          >
            Save
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}

export function EntryDialog({
  slot,
  onOpenChange,
  onSave,
  onRemove,
}: {
  slot: EntrySlot | null;
  onOpenChange: (open: boolean) => void;
  onSave: (day: DayOfWeek, period: number, subjectId: string, teacherId: string, entryId: string | null) => void;
  onRemove: (entryId: string) => void;
}) {
  return (
    <Dialog open={!!slot} onOpenChange={onOpenChange}>
      <DialogContent>
        {slot && <EntryForm key={`${slot.day}-${slot.period}`} slot={slot} onOpenChange={onOpenChange} onSave={onSave} onRemove={onRemove} />}
      </DialogContent>
    </Dialog>
  );
}
