"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormDialog } from "@/components/form-dialog";
import { createTeacher, updateTeacher } from "./actions";

interface NamedUser {
  id: string;
  name: string;
  email: string;
}

interface Teacher {
  id: string;
  employeeCode: string | null;
  qualification: string | null;
  phone: string | null;
}

export function CreateTeacherDialog({ eligibleUsers }: { eligibleUsers: NamedUser[] }) {
  const disabled = eligibleUsers.length === 0;

  return (
    <FormDialog
      triggerLabel="+ Add teacher"
      title="Add teacher profile"
      description={
        disabled
          ? "No users with the TEACHER role are available (or all already have a Teacher profile). Create one via Users first."
          : undefined
      }
      action={createTeacher}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="userId">User</Label>
        <Select name="userId" disabled={disabled}>
          <SelectTrigger id="userId" className="w-full">
            <SelectValue placeholder="Select a user with the TEACHER role" />
          </SelectTrigger>
          <SelectContent>
            {eligibleUsers.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name} ({u.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="employeeCode">Employee code</Label>
        <Input id="employeeCode" name="employeeCode" disabled={disabled} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="qualification">Qualification</Label>
        <Input id="qualification" name="qualification" disabled={disabled} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="joiningDate">Joining date</Label>
        <Input id="joiningDate" name="joiningDate" type="date" disabled={disabled} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" disabled={disabled} />
      </div>
    </FormDialog>
  );
}

export function EditTeacherDialog({ teacher }: { teacher: Teacher }) {
  return (
    <FormDialog triggerLabel="Edit" title="Edit teacher" action={(formData) => updateTeacher(teacher.id, formData)}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="employeeCode">Employee code</Label>
        <Input id="employeeCode" name="employeeCode" defaultValue={teacher.employeeCode ?? ""} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="qualification">Qualification</Label>
        <Input id="qualification" name="qualification" defaultValue={teacher.qualification ?? ""} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" defaultValue={teacher.phone ?? ""} />
      </div>
    </FormDialog>
  );
}
