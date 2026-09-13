"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { Parent } from "@/lib/mock/parents";
import { mockStudents } from "@/lib/mock/students";
import { LinkChildPopover } from "./link-child-popover";

// A nested-relationship record like this doesn't fit a flat table row —
// each parent legitimately has a variable-length list of children inline.
// A card grid keeps that structure visible instead of flattening it into
// a table that would need one row per child duplicating the parent's info.
export function ParentCard({ parent }: { parent: Parent }) {
  const [unlinkTarget, setUnlinkTarget] = useState<string | null>(null);
  const unlinkingChild = parent.children.find((c) => c.linkId === unlinkTarget);
  const unlinkingStudent = unlinkingChild ? mockStudents.find((s) => s.id === unlinkingChild.studentId) : undefined;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{parent.fullName}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {parent.phone}
            {parent.email ? ` · ${parent.email}` : ""}
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {parent.children.length ? (
            <div className="flex flex-col divide-y divide-border rounded-[var(--card-radius)] border border-border">
              {parent.children.map((link) => {
                const student = mockStudents.find((s) => s.id === link.studentId);
                return (
                  <div key={link.linkId} className="flex items-center justify-between px-3 py-2">
                    <div className="flex flex-col">
                      <Link href={`/dashboard/students/${link.studentId}`} className="text-sm font-medium text-foreground hover:underline">
                        {student?.fullName}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {link.relationship ?? "Guardian"} · {student?.admissionNo}
                      </span>
                    </div>
                    <Button variant="ghost" size="icon-sm" onClick={() => setUnlinkTarget(link.linkId)}>
                      <X className="size-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No children linked yet.</p>
          )}
          <LinkChildPopover parent={parent} />
        </CardContent>
      </Card>

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
