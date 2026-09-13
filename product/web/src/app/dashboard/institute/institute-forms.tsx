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

// canEdit mirrors institute.edit from institute/routes.ts — previously
// rendered unconditionally, same class of bug as every other module fixed
// this pass. Same disabled-inputs-and-hidden-submit convention as
// students/[studentId]/profile-form.tsx's canEdit prop.
export function InstituteProfileForm({ institute, canEdit }: { institute: Institute; canEdit: boolean }) {
  const [state, formAction, isPending] = useActionState(updateInstitute, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={institute.name} required disabled={!canEdit} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="type">Type</Label>
          <Select name="type" defaultValue={institute.type} disabled={!canEdit}>
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
          <Input id="phone" name="phone" defaultValue={institute.phone ?? ""} disabled={!canEdit} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={institute.email ?? ""} disabled={!canEdit} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="website">Website</Label>
          <Input id="website" name="website" defaultValue={institute.website ?? ""} disabled={!canEdit} />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" defaultValue={institute.address ?? ""} disabled={!canEdit} />
        </div>
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-muted-foreground">Saved.</p> : null}
      {canEdit && (
        <Button type="submit" disabled={isPending} className="self-start">
          {isPending ? "Saving…" : "Save profile"}
        </Button>
      )}
    </form>
  );
}

// canConfigure mirrors institute.configure — a distinct key from
// institute.edit (see routes.ts), so a user could hold one without the
// other; don't conflate them.
export function InstituteSettingsForm({ settings, canConfigure }: { settings: InstituteSettings; canConfigure: boolean }) {
  const [state, formAction, isPending] = useActionState(updateInstituteSettings, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Input id="timezone" name="timezone" defaultValue={settings.timezone} disabled={!canConfigure} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="locale">Locale</Label>
          <Input id="locale" name="locale" defaultValue={settings.locale} disabled={!canConfigure} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="currency">Currency</Label>
          <Input id="currency" name="currency" defaultValue={settings.currency} disabled={!canConfigure} />
        </div>
        <div />
        <div className="flex flex-col gap-2">
          <Label htmlFor="studentLabel">Student label</Label>
          <Input id="studentLabel" name="studentLabel" defaultValue={settings.studentLabel} disabled={!canConfigure} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="teacherLabel">Teacher label</Label>
          <Input id="teacherLabel" name="teacherLabel" defaultValue={settings.teacherLabel} disabled={!canConfigure} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="classLabel">Class label</Label>
          <Input id="classLabel" name="classLabel" defaultValue={settings.classLabel} disabled={!canConfigure} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="sectionLabel">Section label</Label>
          <Input id="sectionLabel" name="sectionLabel" defaultValue={settings.sectionLabel} disabled={!canConfigure} />
        </div>
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-muted-foreground">Saved.</p> : null}
      {canConfigure && (
        <Button type="submit" disabled={isPending} className="self-start">
          {isPending ? "Saving…" : "Save settings"}
        </Button>
      )}
    </form>
  );
}
