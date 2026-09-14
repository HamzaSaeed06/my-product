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
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/combobox";
import { mockSubjects } from "@/lib/mock/subjects";

const SUBJECT_OPTIONS = mockSubjects.filter((s) => !s.archived).map((s) => ({ value: s.id, label: s.name }));

export function AddTopicDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (topic: string, subjectId: string, expectedCompletionDate: string | null) => void;
}) {
  const [topic, setTopic] = useState("");
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [date, setDate] = useState("");

  function reset() {
    setTopic("");
    setSubjectId(null);
    setDate("");
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
          <DialogTitle>Add a syllabus topic</DialogTitle>
          <DialogDescription>Shared across every section of this class — progress is tracked per section separately.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="topic-name">Topic</FieldLabel>
            <Input id="topic-name" value={topic} onChange={(e) => setTopic(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>Subject</FieldLabel>
            <Combobox options={SUBJECT_OPTIONS} value={subjectId} onChange={setSubjectId} placeholder="Select a subject" />
          </Field>
          <Field>
            <FieldLabel htmlFor="topic-date">Expected completion (optional)</FieldLabel>
            <Input id="topic-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            disabled={!topic.trim() || !subjectId}
            onClick={() => {
              if (!subjectId) return;
              onAdd(topic.trim(), subjectId, date || null);
              onOpenChange(false);
              reset();
            }}
          >
            Add topic
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
