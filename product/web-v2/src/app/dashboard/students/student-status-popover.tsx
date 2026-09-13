"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import type { Student, StudentStatus } from "@/lib/mock/students";

const STATUS_VARIANT: Record<StudentStatus, "default" | "secondary" | "outline"> = {
  ACTIVE: "default",
  INACTIVE: "outline",
  GRADUATED: "secondary",
};

const OPTIONS: StudentStatus[] = ["ACTIVE", "INACTIVE", "GRADUATED"];

// A single-field change (status) gets a small Popover, never a full Dialog —
// this is the quick-edit case from the interaction-pattern rules.
export function StudentStatusPopover({ student }: { student: Student }) {
  const [status, setStatus] = useState(student.status);
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<button type="button" className="cursor-pointer rounded outline-offset-2" />}>
        <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start">
        <div className="flex flex-col gap-0.5">
          {OPTIONS.map((option) => (
            <Button
              key={option}
              variant={option === status ? "secondary" : "ghost"}
              size="sm"
              className="justify-start"
              onClick={() => {
                setStatus(option);
                setOpen(false);
                toast.success(`${student.fullName}'s status set to ${option.toLowerCase()}.`);
              }}
            >
              {option}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
