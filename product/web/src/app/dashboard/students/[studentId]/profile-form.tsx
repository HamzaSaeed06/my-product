"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateStudent } from "./actions";

interface Student {
  id: string;
  fullName: string;
  dateOfBirth: string | null;
  gender: string | null;
  phone: string | null;
  address: string | null;
}

interface FormState {
  error?: string;
  success?: boolean;
}

export function StudentProfileForm({ student }: { student: Student }) {
  const action = async (_prev: FormState, formData: FormData): Promise<FormState> => {
    const result = await updateStudent(student.id, formData);
    return result?.error ? { error: result.error } : { success: true };
  };
  const [state, formAction, isPending] = useActionState<FormState, FormData>(action, {});

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" defaultValue={student.fullName} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="dateOfBirth">Date of birth</Label>
        <Input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={student.dateOfBirth?.slice(0, 10)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="gender">Gender</Label>
        <Input id="gender" name="gender" defaultValue={student.gender ?? ""} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" defaultValue={student.phone ?? ""} />
      </div>
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="address">Address</Label>
        <Input id="address" name="address" defaultValue={student.address ?? ""} />
      </div>
      <div className="sm:col-span-2">
        {state.error ? <p className="mb-2 text-sm text-destructive">{state.error}</p> : null}
        {state.success ? <p className="mb-2 text-sm text-muted-foreground">Saved.</p> : null}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
