import { getCurrentUser } from "@/lib/session";
import { apiRequest } from "@/lib/apiClient";
import { ChildSwitcher } from "@/components/child-switcher";
import { Badge } from "@/components/ui/badge";
import { CreatePortalComplaintDialog } from "./create-dialog";

interface Complaint {
  id: string;
  category: string;
  description: string;
  status: "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "REOPENED";
  resolutionNote: string | null;
}

interface Student {
  id: string;
  fullName: string;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  OPEN: "secondary",
  ASSIGNED: "secondary",
  IN_PROGRESS: "secondary",
  RESOLVED: "default",
  CLOSED: "default",
  REOPENED: "destructive",
};

export default async function PortalComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { studentId: requestedStudentId } = await searchParams;

  const students = await apiRequest<Student[]>("/api/v1/students");
  const studentId = requestedStudentId ?? students[0]?.id;

  if (!studentId) {
    return (
      <div>
        <h1 className="text-lg font-semibold text-foreground">Complaints</h1>
        <p className="mt-4 text-sm text-muted-foreground">No children linked to your account yet.</p>
      </div>
    );
  }

  const complaints = await apiRequest<Complaint[]>(`/api/v1/complaints?studentId=${studentId}`);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Complaints</h1>
        <CreatePortalComplaintDialog studentId={studentId} />
      </div>
      <ChildSwitcher students={students} selectedId={studentId} basePath="/portal/complaints" />

      {complaints.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No complaints yet.</p>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {complaints.map((c) => (
            <div key={c.id} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">{c.category}</p>
                <Badge variant={STATUS_VARIANT[c.status]}>{c.status.replace("_", " ")}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
              {c.resolutionNote ? (
                <p className="mt-2 text-xs text-muted-foreground">Resolution: {c.resolutionNote}</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
