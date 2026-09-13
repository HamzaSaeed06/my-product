"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { StatusDot, type StatusTone } from "@/components/status-dot";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import type { AdmissionInquiry, InquiryStatus } from "@/lib/mock/admission-inquiries";

const TONE: Record<InquiryStatus, StatusTone> = { NEW: "warning", CONTACTED: "neutral", CLOSED: "neutral", CONVERTED: "success" };
const LABEL: Record<InquiryStatus, string> = { NEW: "New", CONTACTED: "Contacted", CLOSED: "Closed", CONVERTED: "Converted" };
// CONVERTED is reached only through the Convert flow (it carries a real
// convertedStudentId) — never offered as a plain status option here.
const OPTIONS: InquiryStatus[] = ["NEW", "CONTACTED", "CLOSED"];

export function InquiryStatusPopover({ inquiry }: { inquiry: AdmissionInquiry }) {
  const [status, setStatus] = useState(inquiry.status);
  const [open, setOpen] = useState(false);

  if (inquiry.status === "CONVERTED") {
    return <StatusDot tone={TONE.CONVERTED}>{LABEL.CONVERTED}</StatusDot>;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<button type="button" className="group flex items-center gap-1 rounded outline-offset-2" />}>
        <StatusDot tone={TONE[status]}>{LABEL[status]}</StatusDot>
        <ChevronDown className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </PopoverTrigger>
      <PopoverContent className="w-40 p-1" align="start">
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
                toast.success(`Inquiry marked ${LABEL[option].toLowerCase()}.`);
              }}
            >
              <StatusDot tone={TONE[option]}>{LABEL[option]}</StatusDot>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
