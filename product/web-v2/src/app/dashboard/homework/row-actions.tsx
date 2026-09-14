"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Upload, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { Homework } from "@/lib/mock/homework";

export function HomeworkRowActions({ homework }: { homework: Homework }) {
  const [archiveOpen, setArchiveOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" />}>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {homework.status === "DRAFT" && (
            <DropdownMenuItem onClick={() => toast.success("Homework published.")}>
              <Upload className="size-3.5" />
              Publish
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setArchiveOpen(true)}>
            <Archive className="size-3.5" />
            Archive
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={`Archive "${homework.title}"?`}
        description="Removes it from students' and parents' view. Kept in history, not deleted."
        confirmLabel="Archive"
        successMessage="Homework archived."
      />
    </>
  );
}
