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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/combobox";
import type { Parent } from "@/lib/mock/parents";
import { mockStudents } from "@/lib/mock/students";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").toUpperCase();
}

// The student list can run into the hundreds and the same name can occur
// more than once — the search results carry class/section/campus, not just
// a name, and picking one shows a full-detail preview card before the
// Link button is enabled, so a parent never gets linked to the wrong
// same-name student by mistake.
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

  const eligible = mockStudents.filter((s) => s.status === "ACTIVE" && !parent.children.some((c) => c.studentId === s.id));
  const options = eligible.map((s) => ({
    value: s.id,
    label: `${s.fullName} — ${s.admissionNo} · ${s.className}-${s.section} · ${s.campusName}`,
  }));
  const selected = eligible.find((s) => s.id === studentId);

  function handleLink() {
    onOpenChange(false);
    toast.success(`${selected?.fullName} linked to ${parent.fullName}.`);
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
            <Combobox options={options} value={studentId} onChange={setStudentId} placeholder="Search students…" className="w-full" />
          </Field>

          {selected ? (
            <div className="flex items-center gap-3 rounded-[var(--card-radius)] border border-border p-3">
              <Avatar className="size-10 shrink-0">
                <AvatarFallback className="bg-secondary text-secondary-foreground">{initials(selected.fullName)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{selected.fullName}</span>
                <span className="font-mono text-xs text-muted-foreground">{selected.admissionNo}</span>
                <span className="text-xs text-muted-foreground">
                  {selected.className}-{selected.section} · {selected.campusName}
                </span>
              </div>
            </div>
          ) : null}

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
            Link this student
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
