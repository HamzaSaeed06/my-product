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
import { Checkbox } from "@/components/ui/checkbox";
import type { CheckinMethod } from "@/lib/mock/feature-config";

const METHOD_OPTIONS: { value: CheckinMethod; label: string }[] = [
  { value: "QR", label: "QR code" },
  { value: "MANUAL", label: "Manual entry" },
  { value: "REMOTE_APPROVED", label: "Remote (needs approval)" },
];

export function CampusOverrideSheet({
  campusName,
  value,
  open,
  onOpenChange,
}: {
  campusName: string;
  value: CheckinMethod[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selected, setSelected] = useState<CheckinMethod[]>(value);

  function handleSave() {
    onOpenChange(false);
    toast.success(`${campusName}'s check-in methods updated.`);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0">
        <SheetHeader>
          <SheetTitle>{campusName} — check-in methods</SheetTitle>
          <SheetDescription>This overrides the institute default for this campus only.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 py-2">
          <Field>
            <FieldLabel>Allowed methods</FieldLabel>
            <div className="flex flex-col gap-2">
              {METHOD_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={selected.includes(opt.value)}
                    onCheckedChange={() =>
                      setSelected((prev) => (prev.includes(opt.value) ? prev.filter((v) => v !== opt.value) : [...prev, opt.value]))
                    }
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </Field>
        </div>
        <SheetFooter className="mt-auto flex-row justify-end gap-2 border-t border-border pt-4">
          <SheetClose render={<Button variant="outline" />}>Cancel</SheetClose>
          <Button onClick={handleSave} disabled={selected.length === 0}>
            Save override
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
