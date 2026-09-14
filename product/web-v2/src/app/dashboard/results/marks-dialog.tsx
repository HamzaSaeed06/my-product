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
import { mockSubjects } from "@/lib/mock/subjects";
import type { ResultItem } from "@/lib/mock/results";

export function MarksDialog({
  studentName,
  items,
  open,
  onOpenChange,
  onSave,
}: {
  studentName: string;
  items: ResultItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (marks: Record<string, number | null>) => void;
}) {
  const [marks, setMarks] = useState<Record<string, string>>(
    () => Object.fromEntries(items.map((i) => [i.id, i.marksObtained === null ? "" : String(i.marksObtained)])),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter marks — {studentName}</DialogTitle>
          <DialogDescription>Only editable while this result is still a draft.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <Field key={item.id} orientation="horizontal">
              <FieldLabel htmlFor={`mark-${item.id}`} className="flex-1">
                {mockSubjects.find((s) => s.id === item.subjectId)?.name}
              </FieldLabel>
              <Input
                id={`mark-${item.id}`}
                type="number"
                min={0}
                max={item.maxMarks}
                className="w-24"
                value={marks[item.id] ?? ""}
                onChange={(e) => setMarks((prev) => ({ ...prev, [item.id]: e.target.value }))}
              />
              <span className="text-xs text-muted-foreground">/ {item.maxMarks}</span>
            </Field>
          ))}
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            onClick={() => {
              onSave(Object.fromEntries(Object.entries(marks).map(([id, v]) => [id, v === "" ? null : Number(v)])));
              onOpenChange(false);
            }}
          >
            Save marks
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
