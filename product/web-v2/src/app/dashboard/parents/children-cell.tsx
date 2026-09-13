"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { Parent } from "@/lib/mock/parents";
import { mockStudents } from "@/lib/mock/students";
import { LinkChildPopover } from "./link-child-popover";

// The linking mechanism itself (Popover, Combobox + relationship field)
// is unchanged from the card-based version — only its home moved, from a
// standalone card into this table cell, to match every other list page.
export function ChildrenCell({ parent }: { parent: Parent }) {
  const [unlinkTarget, setUnlinkTarget] = useState<string | null>(null);
  const unlinkingChild = parent.children.find((c) => c.linkId === unlinkTarget);
  const unlinkingStudent = unlinkingChild ? mockStudents.find((s) => s.id === unlinkingChild.studentId) : undefined;

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {parent.children.map((link) => {
          const student = mockStudents.find((s) => s.id === link.studentId);
          return (
            <span key={link.linkId} className="inline-flex items-center gap-1 rounded-full border border-border py-0.5 pr-1 pl-2 text-xs">
              <Link href={`/dashboard/students/${link.studentId}`} className="hover:underline">
                {student?.fullName}
              </Link>
              <button
                type="button"
                className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setUnlinkTarget(link.linkId)}
                aria-label={`Unlink ${student?.fullName}`}
              >
                <X className="size-3" />
              </button>
            </span>
          );
        })}
        <LinkChildPopover parent={parent} />
      </div>

      <ConfirmDialog
        open={!!unlinkTarget}
        onOpenChange={(v) => !v && setUnlinkTarget(null)}
        title={`Unlink ${unlinkingStudent?.fullName ?? "this student"}?`}
        description="Removes the guardian relationship only — the student's own record is unaffected."
        confirmLabel="Unlink"
        successMessage="Child unlinked."
        onConfirm={() => setUnlinkTarget(null)}
      />
    </>
  );
}
