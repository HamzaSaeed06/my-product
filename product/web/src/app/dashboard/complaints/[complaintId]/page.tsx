import { apiRequest } from "@/lib/apiClient";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { AssignComplaintDialog } from "../assign-dialog";
import { ResolveComplaintDialog } from "../resolve-dialog";
import { ReopenComplaintDialog } from "../reopen-dialog";
import { AddComplaintNoteDialog } from "../add-note-dialog";
import { StartProgressButton, CloseComplaintButton } from "../status-actions";

interface UserWithRoles {
  id: string;
  fullName: string;
  roles: { roleName: string }[];
}

interface ComplaintNote {
  id: string;
  note: string;
  createdAt: string;
  author: { fullName: string };
}

interface Complaint {
  id: string;
  category: string;
  description: string;
  status: "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "REOPENED";
  resolutionNote: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  student: { fullName: string; studentCode: string } | null;
  submittedBy: { fullName: string };
  assignedTo: { id: string; fullName: string } | null;
  notes: ComplaintNote[];
}

const STAFF_ROLES = new Set(["SUPER_ADMIN", "PRINCIPAL", "INCHARGE", "OFFICE", "TEACHER"]);

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  OPEN: "secondary",
  ASSIGNED: "secondary",
  IN_PROGRESS: "secondary",
  RESOLVED: "default",
  CLOSED: "default",
  REOPENED: "destructive",
};

export default async function ComplaintDetailPage({
  params,
}: {
  params: Promise<{ complaintId: string }>;
}) {
  const { complaintId } = await params;
  const [complaint, users] = await Promise.all([
    apiRequest<Complaint>(`/api/v1/complaints/${complaintId}`),
    apiRequest<UserWithRoles[]>("/api/v1/users"),
  ]);

  const assigneeOptions = users
    .filter((u) => u.roles.some((r) => STAFF_ROLES.has(r.roleName)))
    .map((u) => ({ id: u.id, label: u.fullName }));

  return (
    <div>
      <PageHeader
        title={complaint.category}
        description={
          complaint.student
            ? `Filed by ${complaint.submittedBy.fullName} · Regarding ${complaint.student.fullName} (${complaint.student.studentCode})`
            : `Filed by ${complaint.submittedBy.fullName}`
        }
        action={<Badge variant={STATUS_VARIANT[complaint.status]}>{complaint.status.replace("_", " ")}</Badge>}
      />

      <div className="rounded-lg border border-border p-4">
        <p className="text-sm text-foreground">{complaint.description}</p>
        {complaint.assignedTo ? (
          <p className="mt-2 text-xs text-muted-foreground">Assigned to {complaint.assignedTo.fullName}</p>
        ) : null}
        {complaint.resolutionNote ? (
          <p className="mt-2 text-xs text-muted-foreground">Resolution: {complaint.resolutionNote}</p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {complaint.status === "OPEN" || complaint.status === "REOPENED" ? (
          <AssignComplaintDialog complaintId={complaint.id} assignees={assigneeOptions} />
        ) : null}
        {complaint.status === "ASSIGNED" ? <StartProgressButton complaintId={complaint.id} /> : null}
        {complaint.status === "IN_PROGRESS" ? <ResolveComplaintDialog complaintId={complaint.id} /> : null}
        {complaint.status === "RESOLVED" ? <CloseComplaintButton complaintId={complaint.id} /> : null}
        {complaint.status === "CLOSED" ? <ReopenComplaintDialog complaintId={complaint.id} /> : null}
        {complaint.status !== "CLOSED" ? <AddComplaintNoteDialog complaintId={complaint.id} /> : null}
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Notes</h2>
        {complaint.notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notes yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {complaint.notes.map((note) => (
              <div key={note.id} className="rounded-lg border border-border p-3">
                <p className="text-sm text-foreground">{note.note}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {note.author.fullName} · {new Date(note.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
