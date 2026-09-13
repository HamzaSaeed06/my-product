import Link from "next/link";
import { apiRequest } from "@/lib/apiClient";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreateComplaintDialog } from "./create-dialog";

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

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  OPEN: "secondary",
  ASSIGNED: "secondary",
  IN_PROGRESS: "secondary",
  RESOLVED: "default",
  CLOSED: "default",
  REOPENED: "destructive",
};

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

      {complaints.length === 0 ? (
        <p className="text-sm text-muted-foreground">No complaints yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Assigned to</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {complaints.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <p className="font-medium text-foreground">{c.category}</p>
                    <p className="max-w-xs truncate text-xs text-muted-foreground">{c.description}</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.student ? `${c.student.fullName} (${c.student.studentCode})` : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.assignedTo?.fullName ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[c.status]}>{c.status.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/complaints/${c.id}`} className="text-sm text-foreground hover:underline">
                      View →
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
