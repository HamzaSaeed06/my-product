"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusDot, type StatusTone } from "@/components/status-dot";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { ParentChildLink } from "@/lib/mock/parents";
import type { Student } from "@/lib/mock/students";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").toUpperCase();
}

const FEE_TONE: Record<Student["feeStatus"], StatusTone> = { PAID: "success", DUE: "warning", OVERDUE: "danger" };
const FEE_LABEL: Record<Student["feeStatus"], string> = { PAID: "Fees paid", DUE: "Fee due", OVERDUE: "Fee overdue" };

// Attendance is shown as today's known percentage, not a fabricated trend
// line — a real day-by-day trend needs the Attendance module's own data,
// which lands in a later batch (same honesty rule as Student Detail's own
// Attendance tab, which shows an Empty state rather than invented history).
export function ChildCard({ link, student, parentName }: { link: ParentChildLink; student: Student; parentName: string }) {
  const [unlinkOpen, setUnlinkOpen] = useState(false);

  return (
    <>
      <Card>
        <CardContent className="flex items-start gap-4 pt-6">
          <Avatar className="size-12 shrink-0">
            <AvatarFallback className="bg-secondary text-secondary-foreground">{initials(student.fullName)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col">
                <Link href={`/dashboard/students/${student.id}`} className="font-medium text-foreground hover:underline">
                  {student.fullName}
                </Link>
                <span className="font-mono text-xs text-muted-foreground">{student.admissionNo}</span>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => setUnlinkOpen(true)} aria-label={`Unlink ${student.fullName}`}>
                <X className="size-3.5" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {student.className} - {student.section} · {student.campusName}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <StatusDot tone={student.attendancePct >= 90 ? "success" : student.attendancePct >= 80 ? "warning" : "danger"}>
                <span className="font-mono tabular-nums">{student.attendancePct}%</span>&nbsp;attendance
              </StatusDot>
              <StatusDot tone={FEE_TONE[student.feeStatus]}>{FEE_LABEL[student.feeStatus]}</StatusDot>
            </div>
            <span className="text-xs text-muted-foreground">{link.relationship ?? "Guardian"}{link.isPrimary ? " · Primary" : ""}</span>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={unlinkOpen}
        onOpenChange={setUnlinkOpen}
        title={`Unlink ${student.fullName}?`}
        description={`Removes the guardian relationship between ${parentName} and ${student.fullName} only — the student's own record is unaffected.`}
        confirmLabel="Unlink"
        successMessage="Child unlinked."
      />
    </>
  );
}
