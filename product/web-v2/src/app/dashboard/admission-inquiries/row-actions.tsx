"use client";

import Link from "next/link";
import { MoreHorizontal, ArrowRightCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdmissionInquiry } from "@/lib/mock/admission-inquiries";

export function InquiryRowActions({ inquiry }: { inquiry: AdmissionInquiry }) {
  const canConvert = inquiry.status !== "CONVERTED" && inquiry.status !== "CLOSED";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" />}>
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem disabled={!canConvert} render={<Link href={`/dashboard/admission-inquiries/${inquiry.id}/convert`} />}>
          <ArrowRightCircle className="size-3.5" />
          Convert to admission
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
