"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Eye, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { Exam } from "@/lib/mock/exams";

export function ExamRowActions({ exam }: { exam: Exam }) {
  const [publishOpen, setPublishOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" />}>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem render={<Link href={`/dashboard/exams/${exam.id}`} />}>
            <Eye className="size-3.5" />
            View
          </DropdownMenuItem>
          {exam.status === "DRAFT" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setPublishOpen(true)}>
                <Upload className="size-3.5" />
                Publish
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        title={`Publish "${exam.name}"?`}
        description="Makes its schedule visible to teachers, students and parents. One-way — it doesn't go back to draft."
        confirmLabel="Publish"
        successMessage="Exam published."
      />
    </>
  );
}
