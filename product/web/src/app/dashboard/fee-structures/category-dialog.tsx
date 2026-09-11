"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FormDialog } from "@/components/form-dialog";
import { createFeeCategory } from "./actions";

export function CreateCategoryDialog({ instituteId }: { instituteId: string }) {
  return (
    <FormDialog triggerLabel="+ Add category" title="Add a fee category" action={createFeeCategory}>
      <input type="hidden" name="instituteId" value={instituteId} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="cat-name">Name</Label>
        <Input id="cat-name" name="name" required placeholder="e.g. Tuition" />
      </div>
    </FormDialog>
  );
}
