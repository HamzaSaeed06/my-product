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
import { Combobox } from "@/components/combobox";
import { mockSections } from "@/lib/mock/sections";
import { mockClasses } from "@/lib/mock/classes";
import { mockSubjects } from "@/lib/mock/subjects";
import { mockExamSchedules, type ExamSchedule } from "@/lib/mock/exams";

const SECTION_OPTIONS = mockSections
  .filter((s) => !s.archived)
  .map((s) => ({ value: s.id, label: `${mockClasses.find((c) => c.id === s.classId)?.name} ${s.name}` }));
const SUBJECT_OPTIONS = mockSubjects.filter((s) => !s.archived).map((s) => ({ value: s.id, label: s.name }));

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// A section can't have two papers overlapping in time on the same date —
// checked service-side across every exam's schedules for that section in
// the real backend, replicated here client-side across mockExamSchedules.
function findOverlap(sectionId: string, date: string, startTime: string, endTime: string, excludeId?: string) {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  return mockExamSchedules.find(
    (s) => s.id !== excludeId && s.sectionId === sectionId && s.date === date && toMinutes(s.startTime) < end && start < toMinutes(s.endTime),
  );
}

export function ScheduleDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (schedule: Omit<ExamSchedule, "id" | "examId">) => void;
}) {
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [date, setDate] = useState("2026-09-25");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:30");
  const [room, setRoom] = useState("");

  function reset() {
    setSectionId(null);
    setSubjectId(null);
    setDate("2026-09-25");
    setStartTime("09:00");
    setEndTime("10:30");
    setRoom("");
  }

  function handleSave() {
    if (!sectionId || !subjectId) return;
    const conflict = findOverlap(sectionId, date, startTime, endTime);
    if (conflict) {
      toast.error("This section already has a paper scheduled at an overlapping time on this date.");
      return;
    }
    onSave({ sectionId, subjectId, date, startTime, endTime, room: room.trim() || null });
    onOpenChange(false);
    reset();
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
          <DialogTitle>Add a paper</DialogTitle>
          <DialogDescription>One subject, for one section, on one date and time.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
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
          <Field>
            <FieldLabel htmlFor="sched-date">Date</FieldLabel>
            <Input id="sched-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="sched-start">Start time</FieldLabel>
              <Input id="sched-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="sched-end">End time</FieldLabel>
              <Input id="sched-end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="sched-room">Room (optional)</FieldLabel>
            <Input id="sched-room" value={room} onChange={(e) => setRoom(e.target.value)} />
          </Field>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button disabled={!sectionId || !subjectId} onClick={handleSave}>
            Add paper
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
