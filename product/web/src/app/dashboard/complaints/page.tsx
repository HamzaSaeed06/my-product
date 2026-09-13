import { apiRequest } from "@/lib/apiClient";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { CreateComplaintDialog } from "./create-dialog";
import { ComplaintsTable } from "./complaints-table";

interface Student {
  id: string;
  fullName: string;
  studentCode: string;
}

interface Complaint {
  id: string;
  category: string;
  description: string;
  status: "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "REOPENED";
  student: { fullName: string; studentCode: string } | null;
  assignedTo: { fullName: string } | null;
  createdAt: string;
}

export default async function ComplaintsPage() {
  const currentUser = await getCurrentUser();
  // Same fix as the Leaves page: /api/v1/students requires the caller to
  // be unrestricted, campus-scoped, or name a sectionId — Incharge (no
  // campusIds, section-scoped only) is none of those, so fetching it
  // unconditionally to feed a "Create complaint" dialog Incharge lacks
  // complaint.create for anyway 500'd the whole page.
  const canCreate = (currentUser?.permissions ?? []).includes("complaint.create");

  const [complaints, students] = await Promise.all([
    apiRequest<Complaint[]>("/api/v1/complaints"),
    canCreate ? apiRequest<Student[]>("/api/v1/students") : Promise.resolve<Student[]>([]),
  ]);

  const studentOptions = students.map((s) => ({ id: s.id, label: `${s.fullName} (${s.studentCode})` }));

  return (
    <div>
      <PageHeader
        title="Complaints"
        description="Open → Assigned → In Progress → Resolved → Closed, with a note trail and a reopen path."
        action={canCreate ? <CreateComplaintDialog students={studentOptions} /> : undefined}
      />

      <ComplaintsTable complaints={complaints} />
    </div>
  );
}
