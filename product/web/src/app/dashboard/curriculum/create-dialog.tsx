"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormDialog } from "@/components/form-dialog";
import { createCurriculumTopic } from "./actions";

interface NamedOption {
  id: string;
  name: string;
}

export function CreateTopicDialog({
  classId,
  academicYearId,
  subjects,
}: {
  classId: string;
  academicYearId: string;
  subjects: NamedOption[];
}) {
  return (
    <FormDialog
      triggerLabel="+ Add topic"
      title="Add a curriculum topic"
      description={subjects.length === 0 ? "Create a subject first." : undefined}
      action={createCurriculumTopic}
    >
      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="academicYearId" value={academicYearId} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="curr-subject">Subject</Label>
        <Select name="subjectId" disabled={subjects.length === 0}>
          <SelectTrigger id="curr-subject" className="w-full">
            <SelectValue placeholder="Select a subject" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="curr-topic">Topic</Label>
        <Input id="curr-topic" name="topic" required placeholder="e.g. Chapter 3: Fractions" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="curr-sort">Order (optional)</Label>
        <Input id="curr-sort" name="sortOrder" type="number" />
      </div>
    </FormDialog>
  );
}
