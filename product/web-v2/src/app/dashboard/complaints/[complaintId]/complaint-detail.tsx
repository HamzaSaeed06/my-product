"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/combobox";
import { StatusDot, type StatusTone } from "@/components/status-dot";
import { getStudentById } from "@/lib/mock/students";
import { mockCampuses } from "@/lib/mock/campuses";
import { mockAppUsers } from "@/lib/mock/app-users";
import { mockComplaintNotes, type Complaint, type ComplaintNote, type ComplaintStatus } from "@/lib/mock/complaints";
import { ResolveDialog } from "./resolve-dialog";

const STATUS_TONE: Record<ComplaintStatus, StatusTone> = { OPEN: "neutral", ASSIGNED: "warning", IN_PROGRESS: "warning", RESOLVED: "success", CLOSED: "success" };
const STATUS_LABEL: Record<ComplaintStatus, string> = { OPEN: "Open", ASSIGNED: "Assigned", IN_PROGRESS: "In progress", RESOLVED: "Resolved", CLOSED: "Closed" };

const ASSIGNEE_OPTIONS = mockAppUsers.filter((u) => u.isActive).map((u) => ({ value: u.id, label: u.fullName }));

export function ComplaintDetail({ complaint: initial }: { complaint: Complaint }) {
  const [complaint, setComplaint] = useState(initial);
  const [assigneeId, setAssigneeId] = useState<string | null>(initial.assignedToId);
  const [notes, setNotes] = useState<ComplaintNote[]>(mockComplaintNotes.filter((n) => n.complaintId === initial.id));
  const [note, setNote] = useState("");
  const [resolveOpen, setResolveOpen] = useState(false);

  const student = complaint.studentId ? getStudentById(complaint.studentId) : null;
  const campus = mockCampuses.find((c) => c.id === complaint.campusId)?.name;

  function assign() {
    if (!assigneeId) return;
    setComplaint((prev) => ({ ...prev, assignedToId: assigneeId, status: prev.status === "OPEN" ? "ASSIGNED" : prev.status }));
    toast.success("Complaint assigned.");
  }

  function startProgress() {
    setComplaint((prev) => ({ ...prev, status: "IN_PROGRESS" }));
    toast.success("Marked in progress.");
  }

  function resolve(resolutionNote: string) {
    setComplaint((prev) => ({ ...prev, status: "RESOLVED", resolutionNote, resolvedAt: new Date().toISOString() }));
    toast.success("Complaint resolved.");
  }

  function close() {
    setComplaint((prev) => ({ ...prev, status: "CLOSED", closedAt: new Date().toISOString() }));
    toast.success("Complaint closed.");
  }

  function reopen() {
    setComplaint((prev) => ({ ...prev, status: "OPEN", resolutionNote: null, resolvedAt: null, closedAt: null }));
    toast.success("Complaint reopened.");
  }

  function addNote() {
    if (!note.trim()) return;
    setNotes((prev) => [...prev, { id: `cn_${Date.now()}`, complaintId: complaint.id, authorId: "usr_office_1", note: note.trim(), createdAt: new Date().toISOString() }]);
    setNote("");
    toast.success("Note added.");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={complaint.category}
        description={`${student ? student.fullName : "General complaint"} · ${campus}`}
        actions={
          <>
            <StatusDot tone={STATUS_TONE[complaint.status]}>{STATUS_LABEL[complaint.status]}</StatusDot>
            {complaint.status === "ASSIGNED" && <Button size="sm" onClick={startProgress}>Start progress</Button>}
            {complaint.status === "IN_PROGRESS" && <Button size="sm" onClick={() => setResolveOpen(true)}>Resolve</Button>}
            {complaint.status === "RESOLVED" && <Button size="sm" onClick={close}>Close</Button>}
            {(complaint.status === "RESOLVED" || complaint.status === "CLOSED") && (
              <Button size="sm" variant="outline" onClick={reopen}>
                Reopen
              </Button>
            )}
          </>
        }
      />

      <p className="text-sm text-foreground">{complaint.description}</p>
      {complaint.resolutionNote && (
        <p className="rounded-[var(--card-radius)] border border-success/30 bg-success/5 px-4 py-2.5 text-sm text-foreground">
          <span className="font-medium">Resolution: </span>
          {complaint.resolutionNote}
        </p>
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Combobox options={ASSIGNEE_OPTIONS} value={assigneeId} onChange={setAssigneeId} placeholder="Assign to…" />
        </div>
        <Button variant="outline" onClick={assign} disabled={!assigneeId || assigneeId === complaint.assignedToId}>
          {complaint.assignedToId ? "Forward" : "Assign"}
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <span className="label-eyebrow text-muted-foreground">Notes</span>
        <div className="surface-ring flex flex-col divide-y divide-border overflow-hidden rounded-[var(--card-radius)]">
          {notes.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">No notes yet.</p>
          ) : (
            notes.map((n) => (
              <div key={n.id} className="flex flex-col gap-0.5 px-4 py-2.5">
                <span className="text-sm text-foreground">{n.note}</span>
                <span className="text-xs text-muted-foreground">
                  {mockAppUsers.find((u) => u.id === n.authorId)?.fullName} · {new Date(n.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <Textarea placeholder="Add a note…" value={note} onChange={(e) => setNote(e.target.value)} className="flex-1" />
          <Button variant="outline" onClick={addNote} disabled={!note.trim()}>
            Add
          </Button>
        </div>
      </div>

      <ResolveDialog open={resolveOpen} onOpenChange={setResolveOpen} onConfirm={resolve} />
    </div>
  );
}
