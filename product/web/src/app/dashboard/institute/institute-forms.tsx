"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateInstitute, updateInstituteSettings } from "./actions";

interface Institute {
  id: string;
  name: string;
  type: "SCHOOL" | "ACADEMY" | "COACHING_CENTER" | "INSTITUTE";
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
}

interface InstituteSettings {
  timezone: string;
  locale: string;
  currency: string;
  studentLabel: string;
  teacherLabel: string;
  classLabel: string;
  sectionLabel: string;
}

const TYPE_OPTIONS = [
  { value: "SCHOOL", label: "School" },
  { value: "ACADEMY", label: "Academy" },
  { value: "COACHING_CENTER", label: "Coaching Center" },
  { value: "INSTITUTE", label: "Institute" },
] as const;

export function InstituteProfileForm({ institute }: { institute: Institute }) {
  const [state, formAction, isPending] = useActionState(updateInstitute, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={institute.name} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="type">Type</Label>
          <Select name="type" defaultValue={institute.type}>
            <SelectTrigger id="type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={institute.phone ?? ""} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={institute.email ?? ""} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="website">Website</Label>
          <Input id="website" name="website" defaultValue={institute.website ?? ""} />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" defaultValue={institute.address ?? ""} />
        </div>
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-muted-foreground">Saved.</p> : null}
      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}

export function InstituteSettingsForm({ settings }: { settings: InstituteSettings }) {
  const [state, formAction, isPending] = useActionState(updateInstituteSettings, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Input id="timezone" name="timezone" defaultValue={settings.timezone} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="locale">Locale</Label>
          <Input id="locale" name="locale" defaultValue={settings.locale} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="currency">Currency</Label>
          <Input id="currency" name="currency" defaultValue={settings.currency} />
        </div>
        <div />
        <div className="flex flex-col gap-2">
          <Label htmlFor="studentLabel">Student label</Label>
          <Input id="studentLabel" name="studentLabel" defaultValue={settings.studentLabel} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="teacherLabel">Teacher label</Label>
          <Input id="teacherLabel" name="teacherLabel" defaultValue={settings.teacherLabel} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="classLabel">Class label</Label>
          <Input id="classLabel" name="classLabel" defaultValue={settings.classLabel} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="sectionLabel">Section label</Label>
          <Input id="sectionLabel" name="sectionLabel" defaultValue={settings.sectionLabel} />
        </div>
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-muted-foreground">Saved.</p> : null}
      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}
