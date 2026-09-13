"use client";

import { useState } from "react";
import { Pencil, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Parent } from "@/lib/mock/parents";
import { ParentSheet } from "../parent-sheet";
import { LinkChildDialog } from "../link-child-dialog";

export function ParentDetailActions({ parent }: { parent: Parent }) {
  const [editOpen, setEditOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil className="size-3.5" />
          Edit
        </Button>
        <Button size="sm" onClick={() => setLinkOpen(true)}>
          <UserPlus className="size-3.5" />
          Link child
        </Button>
      </div>
      <ParentSheet parent={parent} open={editOpen} onOpenChange={setEditOpen} />
      <LinkChildDialog parent={parent} open={linkOpen} onOpenChange={setLinkOpen} />
    </>
  );
}
