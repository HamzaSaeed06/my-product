"use client";

import { useState } from "react";
import { MoreHorizontal, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { Substitution } from "@/lib/mock/substitutions";

export function SubstitutionRowActions({ substitution }: { substitution: Substitution }) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const isActive = !substitution.cancelledAt;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" disabled={!isActive} />}>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem variant="destructive" onClick={() => setCancelOpen(true)}>
            <Ban className="size-3.5" />
            Cancel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this substitution?"
        description="The original teacher is reinstated for this period. This record is kept, not deleted."
        confirmLabel="Cancel substitution"
        successMessage="Substitution cancelled."
      />
    </>
  );
}
