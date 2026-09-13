"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Pencil, Archive, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { CampusOverview } from "@/lib/mock/campuses";
import { CampusSheet } from "./campus-sheet";

export function CampusRowActions({ campus }: { campus: CampusOverview }) {
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" />}>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem render={<Link href={`/dashboard/campuses/${campus.id}`} />}>
            <Eye className="size-3.5" />
            View
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="size-3.5" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setArchiveOpen(true)}>
            <Archive className="size-3.5" />
            Archive
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CampusSheet campus={campus} open={editOpen} onOpenChange={setEditOpen} />
      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={`Archive ${campus.name}?`}
        description="Blocked if this campus has any active sections — archive or move those sections first."
        confirmLabel="Archive"
        successMessage={`${campus.name} archived.`}
      />
    </>
  );
}
