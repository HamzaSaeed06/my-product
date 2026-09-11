"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FormDialog } from "@/components/form-dialog";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { createAdmission, approveAdmission, rejectAdmission, withdrawAdmission } from "./actions";

interface NamedOption {
  id: string;
  name: string;
}
interface StudentOption {
  id: string;
  studentCode: string;
  fullName: string;
}

export function CreateAdmissionDialog({
  students,
  campuses,
  classes,
  academicYears,
}: {
  students: StudentOption[];
  campuses: NamedOption[];
  classes: NamedOption[];
  academicYears: NamedOption[];
}) {
  const disabled = students.length === 0 || campuses.length === 0 || classes.length === 0 || academicYears.length === 0;

  return (
    <FormDialog
      triggerLabel="+ New admission"
      title="New admission application"
      description={disabled ? "Need at least one student, campus, class, and academic year first." : undefined}
      action={createAdmission}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="studentId">Student</Label>
        <Select name="studentId" disabled={disabled}>
          <SelectTrigger id="studentId" className="w-full">
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
        <Label htmlFor="campusId">Campus</Label>
        <Select name="campusId" disabled={disabled}>
          <SelectTrigger id="campusId" className="w-full">
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
        <Label htmlFor="classId">Class</Label>
        <Select name="classId" disabled={disabled}>
          <SelectTrigger id="classId" className="w-full">
            <SelectValue placeholder="Select a class" />
          </SelectTrigger>
          <SelectContent>
            {classes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="academicYearId">Academic year</Label>
        <Select name="academicYearId" disabled={disabled}>
          <SelectTrigger id="academicYearId" className="w-full">
            <SelectValue placeholder="Select an academic year" />
          </SelectTrigger>
          <SelectContent>
            {academicYears.map((y) => (
              <SelectItem key={y.id} value={y.id}>
                {y.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </FormDialog>
  );
}

export function ApproveAdmissionButton({ id, studentName }: { id: string; studentName: string }) {
  return (
    <ConfirmActionButton
      label="Approve"
      confirmTitle={`Approve admission for ${studentName}?`}
      confirmDescription="This does not automatically enroll the student — enrollment is a separate step from the student's detail page."
      action={() => approveAdmission(id)}
    />
  );
}

export function RejectAdmissionButton({ id, studentName }: { id: string; studentName: string }) {
  return (
    <ConfirmActionButton
      label="Reject"
      confirmTitle={`Reject admission for ${studentName}?`}
      confirmDescription="This cannot be undone from here."
      destructive
      action={() => rejectAdmission(id)}
    />
  );
}

export function WithdrawAdmissionButton({ id, studentName }: { id: string; studentName: string }) {
  return (
    <ConfirmActionButton
      label="Withdraw"
      confirmTitle={`Withdraw this application for ${studentName}?`}
      confirmDescription="Use this when the applicant decides not to proceed."
      action={() => withdrawAdmission(id)}
    />
  );
}
