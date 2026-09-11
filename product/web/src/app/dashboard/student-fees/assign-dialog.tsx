"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormDialog } from "@/components/form-dialog";
import { assignStudentFee } from "./actions";

interface StudentOption {
  id: string;
  fullName: string;
  studentCode: string;
}

interface StructureOption {
  id: string;
  label: string;
}

export function AssignStudentFeeDialog({ students, structures }: { students: StudentOption[]; structures: StructureOption[] }) {
  const disabled = students.length === 0 || structures.length === 0;

  return (
    <FormDialog
      triggerLabel="+ Assign fee"
      title="Assign a fee structure to a student"
      description={disabled ? "Need at least one student and one fee structure first." : undefined}
      action={assignStudentFee}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="sf-student">Student</Label>
        <Select name="studentId" disabled={disabled}>
          <SelectTrigger id="sf-student" className="w-full">
            <SelectValue placeholder="Select a student" />
          </SelectTrigger>
          <SelectContent>
            {students.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.fullName} ({s.studentCode})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="sf-structure">Fee structure</Label>
        <Select name="feeStructureId" disabled={disabled}>
          <SelectTrigger id="sf-structure" className="w-full">
            <SelectValue placeholder="Select a fee structure" />
          </SelectTrigger>
          <SelectContent>
            {structures.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="sf-override">Override amount (optional)</Label>
        <Input id="sf-override" name="overrideAmount" placeholder="Leave blank to use the structure's amount" />
      </div>
    </FormDialog>
  );
}
