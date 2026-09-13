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
import type { Parent } from "@/lib/mock/parents";
import { mockStudents } from "@/lib/mock/students";

// A small Dialog rather than a Popover now that it's triggered from a
// row-actions dropdown item instead of a persistent inline button — a
// Popover needs a trigger element that stays mounted to anchor to, which
// a closed dropdown item no longer provides. Same two fields either way.
export function LinkChildDialog({
  parent,
  open,
  onOpenChange,
}: {
  parent: Parent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [relationship, setRelationship] = useState("");

  const options = mockStudents
    .filter((s) => s.status === "ACTIVE" && !parent.children.some((c) => c.studentId === s.id))
    .map((s) => ({ value: s.id, label: `${s.fullName} (${s.admissionNo})` }));

  function handleLink() {
    const student = mockStudents.find((s) => s.id === studentId);
    onOpenChange(false);
    toast.success(`${student?.fullName} linked to ${parent.fullName}.`);
    setStudentId(null);
    setRelationship("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Link a child</DialogTitle>
          <DialogDescription>Search by name or admission number.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel>Student</FieldLabel>
            <Combobox options={options} value={studentId} onChange={setStudentId} placeholder="Search students…" />
          </Field>
          <Field>
            <FieldLabel htmlFor="link-relationship">Relationship</FieldLabel>
            <Input
              id="link-relationship"
              placeholder="Father / Mother / Guardian"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
            />
          </Field>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button disabled={!studentId} onClick={handleLink}>
            Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
