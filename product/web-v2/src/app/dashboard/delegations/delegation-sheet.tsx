"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/combobox";
import { mockStaffUsers } from "@/lib/mock/users";
import { mockCampuses } from "@/lib/mock/campuses";

const DELEGATE_OPTIONS = mockStaffUsers.filter((u) => u.role !== "SUPER_ADMIN").map((u) => ({ value: u.id, label: u.fullName }));
const ROLE_OPTIONS = [
  { value: "CAMPUS_HEAD", label: "Campus Head" },
  { value: "INCHARGE", label: "Incharge" },
  { value: "OFFICE", label: "Office" },
];
const CAMPUS_OPTIONS = mockCampuses.map((c) => ({ value: c.id, label: c.name }));

// New pattern with no old-frontend page to reference. Genuinely multi-step
// this is not — it's one focused grant, so a Sheet fits the same
// "medium form tied to an action" pattern as everything else in this
// batch. Delegating SUPER_ADMIN itself is refused by the backend, so that
// role is deliberately absent from the options above.
export function DelegationSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [delegateTo, setDelegateTo] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [campusId, setCampusId] = useState<string | null>(null);
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [reason, setReason] = useState("");

  function handleSave() {
    onOpenChange(false);
    toast.success("Delegation granted.");
    setDelegateTo(null);
    setRole(null);
    setCampusId(null);
    setValidFrom("");
    setValidUntil("");
    setReason("");
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0">
        <SheetHeader>
          <SheetTitle>New delegation</SheetTitle>
          <SheetDescription>
            Grants the delegate the role&apos;s full permission set, scoped to one campus, only within the
            date range below.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 py-2">
          <Field>
            <FieldLabel>Delegate to</FieldLabel>
            <Combobox options={DELEGATE_OPTIONS} value={delegateTo} onChange={setDelegateTo} placeholder="Select a staff member" />
          </Field>
          <Field>
            <FieldLabel>Role granted</FieldLabel>
            <Combobox options={ROLE_OPTIONS} value={role} onChange={setRole} placeholder="Select a role" />
          </Field>
          <Field>
            <FieldLabel>Campus</FieldLabel>
            <Combobox options={CAMPUS_OPTIONS} value={campusId} onChange={setCampusId} placeholder="Select a campus" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="del-from">Valid from</FieldLabel>
              <Input id="del-from" type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="del-until">Valid until</FieldLabel>
              <Input id="del-until" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="del-reason">Reason</FieldLabel>
            <Textarea id="del-reason" placeholder="Why is this delegation needed?" value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        </div>
        <SheetFooter className="mt-auto flex-row justify-end gap-2 border-t border-border pt-4">
          <SheetClose render={<Button variant="outline" />}>Cancel</SheetClose>
          <Button onClick={handleSave} disabled={!delegateTo || !role || !campusId || !validFrom || !validUntil || !reason}>
            Grant delegation
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
