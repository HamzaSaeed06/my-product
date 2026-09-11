"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormDialog } from "@/components/form-dialog";
import { createStudent } from "./actions";

export function CreateStudentDialog() {
  return (
    <FormDialog
      triggerLabel="+ Add student"
      title="Add student"
      description="Search above first to check for an existing record before creating a new one."
      action={createStudent}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="dateOfBirth">Date of birth</Label>
        <Input id="dateOfBirth" name="dateOfBirth" type="date" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="gender">Gender</Label>
        <Input id="gender" name="gender" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="address">Address</Label>
        <Input id="address" name="address" />
      </div>
    </FormDialog>
  );
}
