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
import { mockAcademicYears } from "@/lib/mock/academic-years";

const YEAR_OPTIONS = mockAcademicYears.filter((y) => y.status === "ACTIVE").map((y) => ({ value: y.id, label: y.name }));

export function CreateExamDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [name, setName] = useState("");
  const [academicYearId, setAcademicYearId] = useState<string | null>(YEAR_OPTIONS[0]?.value ?? null);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setName("");
          setAcademicYearId(YEAR_OPTIONS[0]?.value ?? null);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create an exam</DialogTitle>
          <DialogDescription>Can&apos;t be created in a closed academic year — add papers afterwards from its own page.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="exam-name">Name</FieldLabel>
            <Input id="exam-name" placeholder="e.g. Midterm" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>Academic year</FieldLabel>
            <Combobox options={YEAR_OPTIONS} value={academicYearId} onChange={setAcademicYearId} placeholder="Select a year" />
          </Field>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            disabled={!name.trim() || !academicYearId}
            onClick={() => {
              onOpenChange(false);
              toast.success("Exam created as a draft.");
              setName("");
            }}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
