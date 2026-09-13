"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Pencil, Eye, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Parent } from "@/lib/mock/parents";
import { ParentSheet } from "./parent-sheet";
import { LinkChildDialog } from "./link-child-dialog";

export function ParentRowActions({ parent }: { parent: Parent }) {
  const [editOpen, setEditOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" />}>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem render={<Link href={`/dashboard/parents/${parent.id}`} />}>
            <Eye className="size-3.5" />
            View profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="size-3.5" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setLinkOpen(true)}>
            <UserPlus className="size-3.5" />
            Link child
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ParentSheet parent={parent} open={editOpen} onOpenChange={setEditOpen} />
      <LinkChildDialog parent={parent} open={linkOpen} onOpenChange={setLinkOpen} />
    </>
  );
}
