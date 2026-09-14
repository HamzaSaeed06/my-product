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
import { Textarea } from "@/components/ui/textarea";

export function ResolveDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (note: string) => void;
}) {
  const [note, setNote] = useState("");

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setNote("");
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve this complaint</DialogTitle>
          <DialogDescription>Explain how it was addressed — visible to whoever closes it next.</DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="resolve-note">Resolution note</FieldLabel>
          <Textarea id="resolve-note" value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            disabled={!note.trim()}
            onClick={() => {
              onConfirm(note.trim());
              onOpenChange(false);
              setNote("");
            }}
          >
            Mark resolved
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
