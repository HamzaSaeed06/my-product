"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { StatusDot, type StatusTone } from "@/components/status-dot";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import type { Student, StudentStatus } from "@/lib/mock/students";

const STATUS_TONE: Record<StudentStatus, StatusTone> = {
  ACTIVE: "success",
  INACTIVE: "neutral",
  GRADUATED: "neutral",
};

const STATUS_LABEL: Record<StudentStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  GRADUATED: "Graduated",
};

const OPTIONS: StudentStatus[] = ["ACTIVE", "INACTIVE", "GRADUATED"];

// A single-field change (status) gets a small Popover, never a full Dialog —
// this is the quick-edit case from the interaction-pattern rules.
export function StudentStatusPopover({ student }: { student: Student }) {
  const [status, setStatus] = useState(student.status);
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<button type="button" className="group flex items-center gap-1 rounded outline-offset-2" />}
      >
        <StatusDot tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</StatusDot>
        <ChevronDown className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </PopoverTrigger>
      <PopoverContent className="w-44 p-1" align="start">
        <div className="flex flex-col gap-0.5">
          {OPTIONS.map((option) => (
            <Button
              key={option}
              variant={option === status ? "secondary" : "ghost"}
              size="sm"
              className="justify-start gap-1.5 font-normal"
              onClick={() => {
                setStatus(option);
                setOpen(false);
                toast.success(`${student.fullName}'s status set to ${option.toLowerCase()}.`);
              }}
            >
              <StatusDot tone={STATUS_TONE[option]}>{STATUS_LABEL[option]}</StatusDot>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
