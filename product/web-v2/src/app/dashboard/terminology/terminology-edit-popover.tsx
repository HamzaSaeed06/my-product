"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { TerminologyOverride } from "@/lib/mock/terminology";

// Two fields, tied to one row — a Popover, not a Sheet or a page, per the
// quick-edit rule for anything this small.
export function TerminologyEditPopover({ term }: { term: TerminologyOverride }) {
  const [open, setOpen] = useState(false);
  const [singular, setSingular] = useState(term.singularLabel);
  const [plural, setPlural] = useState(term.pluralLabel);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <Pencil className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="flex flex-col gap-3">
          <Field>
            <FieldLabel htmlFor={`${term.canonicalKey}-singular`}>Singular</FieldLabel>
            <Input id={`${term.canonicalKey}-singular`} value={singular} onChange={(e) => setSingular(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${term.canonicalKey}-plural`}>Plural</FieldLabel>
            <Input id={`${term.canonicalKey}-plural`} value={plural} onChange={(e) => setPlural(e.target.value)} />
          </Field>
          <Button
            size="sm"
            onClick={() => {
              setOpen(false);
              toast.success(`${term.canonicalKey} label updated.`);
            }}
          >
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
