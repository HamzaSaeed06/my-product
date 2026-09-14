"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { StatusDot, type StatusTone } from "@/components/status-dot";
import { getStudentById } from "@/lib/mock/students";
import { mockAppUsers } from "@/lib/mock/app-users";
import { mockLeaves, type LeaveStatus } from "@/lib/mock/leaves";
import { PORTAL_DEMO } from "@/lib/mock/portal-session";
import { usePortal } from "../portal-context";
import { RequestLeaveDialog } from "./create-dialog";

const STATUS_TONE: Record<LeaveStatus, StatusTone> = { PENDING: "warning", APPROVED: "success", REJECTED: "danger", CANCELLED: "neutral" };
const STATUS_LABEL: Record<LeaveStatus, string> = { PENDING: "Pending", APPROVED: "Approved", REJECTED: "Rejected", CANCELLED: "Cancelled" };

export default function PortalLeavePage() {
  const { role, activeChildId } = usePortal();
  const [createOpen, setCreateOpen] = useState(false);

  if (role === "STUDENT") {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Leave" description="Leave requests are made by a parent, not directly by a student." />
      </div>
    );
  }

  const forName = role === "TEACHER" ? mockAppUsers.find((u) => u.id === PORTAL_DEMO.teacherUserId)?.fullName ?? "" : getStudentById(activeChildId)?.fullName ?? "";
  const leaves = mockLeaves.filter((l) => (role === "TEACHER" ? l.teacherId === PORTAL_DEMO.teacherId : l.studentId === activeChildId));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Leave"
        description={role === "TEACHER" ? "Your own leave requests." : `${forName}'s leave requests.`}
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" />
            Request leave
          </Button>
        }
      />
      <div className="surface-ring flex flex-col divide-y divide-border overflow-hidden rounded-[var(--card-radius)]">
        {leaves.length === 0 ? (
          <p className="px-4 py-3 text-sm text-muted-foreground">No leave requests yet.</p>
        ) : (
          leaves.map((l) => (
            <div key={l.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="flex flex-col">
                <span className="font-mono text-sm text-foreground">
                  {l.fromDate} → {l.toDate}
                </span>
                <span className="text-xs text-muted-foreground">{l.reason}</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusDot tone={STATUS_TONE[l.status]}>{STATUS_LABEL[l.status]}</StatusDot>
                {(l.status === "PENDING" || l.status === "APPROVED") && (
                  <Button variant="ghost" size="sm" onClick={() => toast.success("Leave request cancelled.")}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      <RequestLeaveDialog open={createOpen} onOpenChange={setCreateOpen} forName={forName} />
    </div>
  );
}
