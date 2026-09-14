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
import { Combobox } from "@/components/combobox";
import { mockAppUsers } from "@/lib/mock/app-users";
import type { StaffAttendanceRecord } from "@/lib/mock/staff-attendance";

export function MarkDialog({
  open,
  onOpenChange,
  alreadyMarked,
  onMark,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alreadyMarked: StaffAttendanceRecord[];
  onMark: (userId: string) => void;
}) {
  const [userId, setUserId] = useState<string | null>(null);
  const options = mockAppUsers
    .filter((u) => u.isActive && !alreadyMarked.some((r) => r.userId === u.id))
    .map((u) => ({ value: u.id, label: u.fullName }));

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setUserId(null);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark attendance manually</DialogTitle>
          <DialogDescription>For when QR check-in wasn&apos;t available — recorded as a manual override, not auto-verified.</DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel>Staff member</FieldLabel>
          <Combobox options={options} value={userId} onChange={setUserId} placeholder="Select a staff member" />
        </Field>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            disabled={!userId}
            onClick={() => {
              if (!userId) return;
              onMark(userId);
              onOpenChange(false);
              setUserId(null);
            }}
          >
            Mark present
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
