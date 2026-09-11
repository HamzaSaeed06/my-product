"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormDialog } from "@/components/form-dialog";
import { createCampus, updateCampus } from "./actions";

interface Campus {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
}

function CampusFields({ campus }: { campus?: Campus }) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={campus?.name} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="address">Address</Label>
        <Input id="address" name="address" defaultValue={campus?.address ?? ""} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" defaultValue={campus?.phone ?? ""} />
      </div>
    </>
  );
}

export function CreateCampusDialog() {
  return (
    <FormDialog triggerLabel="+ Add campus" title="Add campus" action={createCampus}>
      <CampusFields />
    </FormDialog>
  );
}

export function EditCampusDialog({ campus }: { campus: Campus }) {
  return (
    <FormDialog
      triggerLabel="Edit"
      title={`Edit ${campus.name}`}
      action={(formData) => updateCampus(campus.id, formData)}
    >
      <CampusFields campus={campus} />
    </FormDialog>
  );
}
