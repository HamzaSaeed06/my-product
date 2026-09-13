"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/combobox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Parent } from "@/lib/mock/parents";
import { mockStudents } from "@/lib/mock/students";

// Two fields, tied to one card — a Popover, not a Sheet, per the
// quick-add rule for anything this small.
export function LinkChildPopover({ parent }: { parent: Parent }) {
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [relationship, setRelationship] = useState("");

  const options = mockStudents
    .filter((s) => s.status === "ACTIVE" && !parent.children.some((c) => c.studentId === s.id))
    .map((s) => ({ value: s.id, label: `${s.fullName} (${s.admissionNo})` }));

  function handleLink() {
    const student = mockStudents.find((s) => s.id === studentId);
    setOpen(false);
    toast.success(`${student?.fullName} linked to ${parent.fullName}.`);
    setStudentId(null);
    setRelationship("");
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
        <UserPlus className="size-3.5" />
        Link child
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <div className="flex flex-col gap-3">
          <Field>
            <FieldLabel>Student</FieldLabel>
            <Combobox options={options} value={studentId} onChange={setStudentId} placeholder="Search students…" />
          </Field>
          <Field>
            <FieldLabel htmlFor="link-relationship">Relationship</FieldLabel>
            <Input id="link-relationship" placeholder="Father / Mother / Guardian" value={relationship} onChange={(e) => setRelationship(e.target.value)} />
          </Field>
          <Button size="sm" disabled={!studentId} onClick={handleLink}>
            Link
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
