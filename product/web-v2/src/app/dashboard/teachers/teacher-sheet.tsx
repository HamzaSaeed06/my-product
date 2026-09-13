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
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/combobox";
import type { TeacherProfile } from "@/lib/mock/teachers";
import { mockTeachers } from "@/lib/mock/teachers";
import { mockAppUsers } from "@/lib/mock/app-users";

// Creating a profile never creates the user or assigns the TEACHER role —
// that happens on the Users page first. This picker is deliberately
// narrowed to users who already hold TEACHER and don't have a profile yet,
// so a duplicate profile for the same user can't be created from here.
const AVAILABLE_USER_OPTIONS = mockAppUsers
  .filter((u) => u.roles.some((r) => r.roleName === "Teacher") && !mockTeachers.some((t) => t.userId === u.id))
  .map((u) => ({ value: u.id, label: `${u.fullName} (${u.email})` }));

export function TeacherSheet({
  teacher,
  open,
  onOpenChange,
}: {
  teacher?: TeacherProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [userId, setUserId] = useState<string | null>(teacher?.userId ?? null);
  const [employeeCode, setEmployeeCode] = useState(teacher?.employeeCode ?? "");
  const [qualification, setQualification] = useState(teacher?.qualification ?? "");
  const [phone, setPhone] = useState(teacher?.phone ?? "");
  const [joiningDate, setJoiningDate] = useState(teacher?.joiningDate ?? "");
  const isEdit = !!teacher;
  const teacherName = mockAppUsers.find((u) => u.id === teacher?.userId)?.fullName;

  function handleSave() {
    onOpenChange(false);
    toast.success(isEdit ? "Teacher profile updated." : "Teacher profile created.");
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit teacher profile" : "New teacher profile"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Only the profile fields below are editable — the linked user can't be reassigned."
              : "Pick a user that already holds the Teacher role and has no profile yet."}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 py-2">
          {isEdit ? (
            <Field>
              <FieldLabel>User</FieldLabel>
              <p className="text-sm text-foreground">{teacherName}</p>
              <FieldDescription>Fixed at creation.</FieldDescription>
            </Field>
          ) : (
            <Field>
              <FieldLabel>User</FieldLabel>
              {AVAILABLE_USER_OPTIONS.length ? (
                <Combobox options={AVAILABLE_USER_OPTIONS} value={userId} onChange={setUserId} placeholder="Select a user" />
              ) : (
                <p className="text-xs text-muted-foreground">
                  No Teacher-role users without a profile yet — grant the Teacher role on the Users page first.
                </p>
              )}
            </Field>
          )}
          <Field>
            <FieldLabel htmlFor="tch-code">Employee code</FieldLabel>
            <Input id="tch-code" placeholder="T-1004" value={employeeCode ?? ""} onChange={(e) => setEmployeeCode(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="tch-qual">Qualification</FieldLabel>
            <Input id="tch-qual" value={qualification ?? ""} onChange={(e) => setQualification(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="tch-phone">Phone</FieldLabel>
            <Input id="tch-phone" value={phone ?? ""} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          {!isEdit ? (
            <Field>
              <FieldLabel htmlFor="tch-join">Joining date</FieldLabel>
              <Input id="tch-join" type="date" value={joiningDate ?? ""} onChange={(e) => setJoiningDate(e.target.value)} />
            </Field>
          ) : null}
        </div>
        <SheetFooter className="mt-auto flex-row justify-end gap-2 border-t border-border pt-4">
          <SheetClose render={<Button variant="outline" />}>Cancel</SheetClose>
          <Button onClick={handleSave} disabled={!isEdit && !userId}>
            {isEdit ? "Save changes" : "Create profile"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
