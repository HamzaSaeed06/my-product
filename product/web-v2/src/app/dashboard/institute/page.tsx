"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { mockInstitute, mockInstituteSettings } from "@/lib/mock/institute";

// A true singleton — no list, no create/delete, just two independent
// forms. institute.edit (profile) and institute.configure (settings) are
// separate permissions on the real backend, so a viewer could hold either
// without the other — each card's own save action should disable, not the
// whole page, once this wires to real permission checks in Phase C.
export default function InstitutePage() {
  const [profile, setProfile] = useState(mockInstitute);
  const [settings, setSettings] = useState(mockInstituteSettings);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <PageHeader title="Institute" description="This deployment's single institute record." />

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Gated by institute.edit.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="inst-name">Name</FieldLabel>
            <Input id="inst-name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          </Field>
          <Field>
            <FieldLabel htmlFor="inst-address">Address</FieldLabel>
            <Input id="inst-address" value={profile.address ?? ""} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="inst-phone">Phone</FieldLabel>
              <Input id="inst-phone" value={profile.phone ?? ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
            </Field>
            <Field>
              <FieldLabel htmlFor="inst-email">Email</FieldLabel>
              <Input id="inst-email" type="email" value={profile.email ?? ""} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="inst-website">Website</FieldLabel>
            <Input id="inst-website" value={profile.website ?? ""} onChange={(e) => setProfile({ ...profile, website: e.target.value })} />
          </Field>
        </CardContent>
        <CardFooter className="justify-end bg-transparent">
          <Button size="sm" onClick={() => toast.success("Institute profile updated.")}>
            Save profile
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Gated by institute.configure — a separate permission from profile edits.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="inst-tz">Timezone</FieldLabel>
            <Input id="inst-tz" value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })} />
          </Field>
          <Field>
            <FieldLabel htmlFor="inst-locale">Locale</FieldLabel>
            <Input id="inst-locale" value={settings.locale} onChange={(e) => setSettings({ ...settings, locale: e.target.value })} />
          </Field>
          <Field>
            <FieldLabel htmlFor="inst-currency">Currency</FieldLabel>
            <Input id="inst-currency" value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} />
          </Field>
        </CardContent>
        <CardFooter className="justify-end bg-transparent">
          <Button size="sm" onClick={() => toast.success("Institute settings updated.")}>
            Save settings
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
