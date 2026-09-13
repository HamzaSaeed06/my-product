"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormDialog } from "@/components/form-dialog";
import { createLeave } from "./actions";

interface NamedOption {
  id: string;
  label: string;
}

export function CreateLeaveDialog({ students, teachers }: { students: NamedOption[]; teachers: NamedOption[] }) {
  const [subjectType, setSubjectType] = useState<"STUDENT" | "TEACHER">("STUDENT");

  return (
    <FormDialog triggerLabel="+ Request leave" title="Request a leave" action={createLeave}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="leave-subject">Subject</Label>
        <Select
          name="subjectType"
          value={subjectType}
          onValueChange={(v) => {
            if (v === "STUDENT" || v === "TEACHER") setSubjectType(v);
          }}
        >
          <SelectTrigger id="leave-subject" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="STUDENT">Student</SelectItem>
            <SelectItem value="TEACHER">Teacher</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {subjectType === "STUDENT" ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="leave-student">Student</Label>
          <Select name="studentId" disabled={students.length === 0}>
            <SelectTrigger id="leave-student" className="w-full">
              <SelectValue placeholder="Select a student" />
            </SelectTrigger>
            <SelectContent>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Label htmlFor="leave-teacher">Teacher</Label>
          <Select name="teacherId" disabled={teachers.length === 0}>
            <SelectTrigger id="leave-teacher" className="w-full">
              <SelectValue placeholder="Select a teacher" />
            </SelectTrigger>
            <SelectContent>
              {teachers.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex gap-4">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="leave-from">From</Label>
          <Input id="leave-from" name="fromDate" type="date" required />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="leave-to">To</Label>
          <Input id="leave-to" name="toDate" type="date" required />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="leave-reason">Reason</Label>
        <Input id="leave-reason" name="reason" required placeholder="e.g. Fever" />
      </div>
    </FormDialog>
  );
}
