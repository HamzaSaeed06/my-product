"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormDialog } from "@/components/form-dialog";
import { createCashClosing } from "./actions";

interface CampusOption {
  id: string;
  name: string;
}

export function CreateCashClosingDialog({ campuses }: { campuses: CampusOption[] }) {
  const disabled = campuses.length === 0;

  return (
    <FormDialog
      triggerLabel="+ New closing"
      title="Record a daily cash closing"
      description={disabled ? "Need at least one campus first." : undefined}
      action={createCashClosing}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="cc-campus">Campus</Label>
        <Select name="campusId" disabled={disabled}>
          <SelectTrigger id="cc-campus" className="w-full">
            <SelectValue placeholder="Select a campus" />
          </SelectTrigger>
          <SelectContent>
            {campuses.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cc-date">Date</Label>
        <Input id="cc-date" name="date" type="date" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="cc-opening">Opening balance</Label>
          <Input id="cc-opening" name="openingBalance" required placeholder="0.00" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="cc-collections">Collections</Label>
          <Input id="cc-collections" name="collections" required placeholder="0.00" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="cc-refunds">Refunds paid out</Label>
          <Input id="cc-refunds" name="refundsPaidOut" placeholder="0.00" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="cc-actual">Actual (counted) balance</Label>
          <Input id="cc-actual" name="actualBalance" required placeholder="0.00" />
        </div>
      </div>
    </FormDialog>
  );
}
