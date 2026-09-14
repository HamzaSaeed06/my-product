"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/status-dot";
import { getStudentById } from "@/lib/mock/students";
import { getSectionForStudent } from "@/lib/mock/sections";
import { mockSubjects } from "@/lib/mock/subjects";
import { mockHomework } from "@/lib/mock/homework";
import { PORTAL_DEMO } from "@/lib/mock/portal-session";
import { usePortal } from "../portal-context";
import { CreatePortalHomeworkDialog } from "./create-dialog";

export default function PortalHomeworkPage() {
  const { role, activeChildId } = usePortal();
  const [createOpen, setCreateOpen] = useState(false);

  const student = role !== "TEACHER" ? getStudentById(activeChildId) : null;
  const sectionId = role === "TEACHER" ? PORTAL_DEMO.teacherSectionId : getSectionForStudent(activeChildId)?.id;

  const items = mockHomework.filter((h) => {
    if (h.sectionId !== sectionId) return false;
    if (role === "TEACHER") return h.teacherId === PORTAL_DEMO.teacherId;
    return h.status === "PUBLISHED";
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Homework"
        description={role === "TEACHER" ? "Assignments you've set for your section." : `${student?.fullName}'s assigned homework.`}
        actions={
          role === "TEACHER" ? (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-3.5" />
              Assign homework
            </Button>
          ) : undefined
        }
      />
      <div className="surface-ring flex flex-col divide-y divide-border overflow-hidden rounded-[var(--card-radius)]">
        {items.length === 0 ? (
          <p className="px-4 py-3 text-sm text-muted-foreground">No homework yet.</p>
        ) : (
          items.map((h) => (
            <div key={h.id} className="flex flex-col gap-1 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">{h.title}</span>
                {role === "TEACHER" && <StatusDot tone={h.status === "PUBLISHED" ? "success" : "neutral"}>{h.status === "PUBLISHED" ? "Published" : "Draft"}</StatusDot>}
              </div>
              <span className="text-xs text-muted-foreground">
                {mockSubjects.find((s) => s.id === h.subjectId)?.name} · Due {h.dueDate}
              </span>
              {h.description && <p className="text-sm text-muted-foreground">{h.description}</p>}
            </div>
          ))
        )}
      </div>
      <CreatePortalHomeworkDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
