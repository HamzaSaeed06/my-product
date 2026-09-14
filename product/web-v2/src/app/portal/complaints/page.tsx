"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { StatusDot, type StatusTone } from "@/components/status-dot";
import { getStudentById } from "@/lib/mock/students";
import { mockComplaints, type ComplaintStatus } from "@/lib/mock/complaints";
import { usePortal } from "../portal-context";
import { CreatePortalComplaintDialog } from "./create-dialog";

const STATUS_TONE: Record<ComplaintStatus, StatusTone> = { OPEN: "neutral", ASSIGNED: "warning", IN_PROGRESS: "warning", RESOLVED: "success", CLOSED: "success" };
const STATUS_LABEL: Record<ComplaintStatus, string> = { OPEN: "Open", ASSIGNED: "Assigned", IN_PROGRESS: "In progress", RESOLVED: "Resolved", CLOSED: "Closed" };

export default function PortalComplaintsPage() {
  const { activeChildId } = usePortal();
  const [createOpen, setCreateOpen] = useState(false);
  const student = getStudentById(activeChildId);
  const complaints = mockComplaints.filter((c) => c.studentId === activeChildId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Complaints"
        description={`Complaints logged for ${student?.fullName}.`}
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" />
            Log complaint
          </Button>
        }
      />
      <div className="surface-ring flex flex-col divide-y divide-border overflow-hidden rounded-[var(--card-radius)]">
        {complaints.length === 0 ? (
          <p className="px-4 py-3 text-sm text-muted-foreground">No complaints logged yet.</p>
        ) : (
          complaints.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{c.category}</span>
                <span className="line-clamp-1 max-w-sm text-xs text-muted-foreground">{c.description}</span>
              </div>
              <StatusDot tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</StatusDot>
            </div>
          ))
        )}
      </div>
      <CreatePortalComplaintDialog open={createOpen} onOpenChange={setCreateOpen} forName={student?.fullName ?? ""} />
    </div>
  );
}
