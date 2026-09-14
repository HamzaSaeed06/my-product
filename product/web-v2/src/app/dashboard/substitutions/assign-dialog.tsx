"use client";

import { useState } from "react";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/combobox";
import { mockTimetableEntries, mockTimetables, DAY_LABELS } from "@/lib/mock/timetable";
import { mockSections } from "@/lib/mock/sections";
import { mockClasses } from "@/lib/mock/classes";
import { mockSubjects } from "@/lib/mock/subjects";
import { mockTeachers } from "@/lib/mock/teachers";
import { mockAppUsers } from "@/lib/mock/app-users";

const ENTRY_OPTIONS = mockTimetableEntries.map((entry) => {
  const timetable = mockTimetables.find((t) => t.id === entry.timetableId);
  const section = timetable ? mockSections.find((s) => s.id === timetable.sectionId) : null;
  const className = section ? mockClasses.find((c) => c.id === section.classId)?.name : "";
  const subject = mockSubjects.find((s) => s.id === entry.subjectId)?.name;
  return {
    value: entry.id,
    label: `${className} ${section?.name ?? ""} · ${DAY_LABELS[entry.dayOfWeek]} P${entry.periodNumber} · ${subject}`,
  };
});

function teacherOptions(excludeTeacherId?: string) {
  return mockTeachers
    .filter((t) => t.status === "ACTIVE" && t.id !== excludeTeacherId)
    .map((t) => ({ value: t.id, label: mockAppUsers.find((u) => u.id === t.userId)?.fullName ?? t.id }));
}

export function AssignSubstituteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [entryId, setEntryId] = useState<string | null>(null);
  const [date, setDate] = useState("2026-09-15");
  const [substituteId, setSubstituteId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const entry = mockTimetableEntries.find((e) => e.id === entryId);

  function reset() {
    setEntryId(null);
    setDate("2026-09-15");
    setSubstituteId(null);
    setReason("");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign a substitute</DialogTitle>
          <DialogDescription>The original teacher on this period is filled in automatically once you pick the class/period.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel>Class / period</FieldLabel>
            <Combobox options={ENTRY_OPTIONS} value={entryId} onChange={setEntryId} placeholder="Select a class and period" />
          </Field>
          <Field>
            <FieldLabel htmlFor="sub-date">Date</FieldLabel>
            <Input id="sub-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>Substitute teacher</FieldLabel>
            <Combobox options={teacherOptions(entry?.teacherId)} value={substituteId} onChange={setSubstituteId} placeholder="Select a teacher" />
          </Field>
          <Field>
            <FieldLabel htmlFor="sub-reason">Reason (optional)</FieldLabel>
            <Textarea id="sub-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            disabled={!entryId || !substituteId}
            onClick={() => {
              onOpenChange(false);
              toast.success("Substitute assigned.");
              reset();
            }}
          >
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
