"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormDialog } from "@/components/form-dialog";
import { createPlan } from "./actions";

export function CreatePlanDialog() {
  return (
    <FormDialog triggerLabel="+ Add plan" title="Add a plan" action={createPlan}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="plan-name">Name</Label>
        <Input id="plan-name" name="name" required placeholder="e.g. Professional" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="plan-tier">Tier key</Label>
        <Input id="plan-tier" name="tier" required placeholder="e.g. professional" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="plan-features">Features (comma-separated)</Label>
        <Input id="plan-features" name="features" placeholder="online_payments, parent_portal, advanced_reports" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="plan-max-students">Max students</Label>
          <Input id="plan-max-students" name="maxStudents" type="number" min={1} required defaultValue={1000} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="plan-max-campuses">Max campuses</Label>
          <Input id="plan-max-campuses" name="maxCampuses" type="number" min={1} required defaultValue={3} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="plan-max-staff">Max staff</Label>
          <Input id="plan-max-staff" name="maxStaff" type="number" min={1} required defaultValue={100} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="plan-max-storage">Max storage (MB)</Label>
          <Input id="plan-max-storage" name="maxStorageMb" type="number" min={1} required defaultValue={10240} />
        </div>
      </div>
    </FormDialog>
  );
}
