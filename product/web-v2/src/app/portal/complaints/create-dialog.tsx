"use client";

import { useState } from "react";
import { toast } from "sonner";
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
import { Combobox } from "@/components/combobox";

const CATEGORY_OPTIONS = [
  { value: "Bullying", label: "Bullying" },
  { value: "Academic", label: "Academic" },
  { value: "Facilities", label: "Facilities" },
  { value: "Behavioral", label: "Behavioral" },
  { value: "Other", label: "Other" },
];

export function CreatePortalComplaintDialog({
  open,
  onOpenChange,
  forName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  forName: string;
}) {
  const [category, setCategory] = useState<string | null>(null);
  const [description, setDescription] = useState("");

  function reset() {
    setCategory(null);
    setDescription("");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log a complaint for {forName}</DialogTitle>
          <DialogDescription>A staff member will follow up and update its status here.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel>Category</FieldLabel>
            <Combobox options={CATEGORY_OPTIONS} value={category} onChange={setCategory} placeholder="Select a category" />
          </Field>
          <Field>
            <FieldLabel htmlFor="pc-desc">Description</FieldLabel>
            <Textarea id="pc-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            disabled={!category || !description.trim()}
            onClick={() => {
              onOpenChange(false);
              toast.success("Complaint logged.");
              reset();
            }}
          >
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
