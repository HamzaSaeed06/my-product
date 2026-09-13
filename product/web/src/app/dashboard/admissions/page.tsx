import Link from "next/link";
import { apiRequest } from "@/lib/apiClient";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  CreateAdmissionDialog,
  ApproveAdmissionButton,
  RejectAdmissionButton,
  WithdrawAdmissionButton,
} from "./admission-dialogs";

interface Admission {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN";
  appliedAt: string;
  student: { id: string; studentCode: string; fullName: string };
  campus: { name: string };
  klass: { name: string };
  academicYear: { name: string };
}

interface StudentOption {
  id: string;
  studentCode: string;
  fullName: string;
}
interface NamedOption {
  id: string;
  name: string;
}

function statusBadge(status: Admission["status"]) {
  if (status === "APPROVED") return <Badge>Approved</Badge>;
  if (status === "PENDING") return <Badge variant="secondary">Pending</Badge>;
  return <Badge variant="secondary">{status.charAt(0) + status.slice(1).toLowerCase()}</Badge>;
}

export default async function AdmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ campusId?: string }>;
}) {
  const { campusId } = await searchParams;

  // Mirrors admission.create/admission.approve/admission.reject from
  // routes.ts — note the withdraw route also requires admission.create
  // (there's no separate admission.withdraw key). Campus Head/Office can
  // hold admission.view without admission.create, so the "New admission"
  // dialog and the students/campuses/classes/academic-years fetches that
  // exist only to feed its dropdowns (the table itself renders each
  // admission's embedded student/campus/class/academicYear, not these
  // lookups) must not render/fetch unconditionally.
  const currentUser = await getCurrentUser();
  const permissions = currentUser?.permissions ?? [];
  const canCreate = permissions.includes("admission.create");
  const canApprove = permissions.includes("admission.approve");
  const canReject = permissions.includes("admission.reject");
  const canWithdraw = permissions.includes("admission.create");

  const [admissions, students, campuses, classes, academicYears] = await Promise.all([
    apiRequest<Admission[]>(`/api/v1/admissions${campusId ? `?campusId=${campusId}` : ""}`),
    canCreate ? apiRequest<StudentOption[]>("/api/v1/students?status=ACTIVE") : Promise.resolve<StudentOption[]>([]),
    canCreate ? apiRequest<NamedOption[]>("/api/v1/campuses") : Promise.resolve<NamedOption[]>([]),
    canCreate ? apiRequest<NamedOption[]>("/api/v1/classes") : Promise.resolve<NamedOption[]>([]),
    canCreate ? apiRequest<NamedOption[]>("/api/v1/academic-years") : Promise.resolve<NamedOption[]>([]),
  ]);

  return (
    <div>
      <PageHeader
        title="Admissions"
        description="Admission ≠ Enrollment — approving here does not automatically enroll the student."
        action={
          canCreate ? (
            <CreateAdmissionDialog students={students} campuses={campuses} classes={classes} academicYears={academicYears} />
          ) : undefined
        }
      />

      {admissions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No admission applications yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Campus</TableHead>
                <TableHead>Academic year</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admissions.map((admission) => (
                <TableRow key={admission.id}>
                  <TableCell className="font-medium">
                    <Link href={`/dashboard/students/${admission.student.id}`} className="hover:underline">
                      {admission.student.fullName}
                    </Link>{" "}
                    <span className="text-muted-foreground">({admission.student.studentCode})</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{admission.klass.name}</TableCell>
                  <TableCell className="text-muted-foreground">{admission.campus.name}</TableCell>
                  <TableCell className="text-muted-foreground">{admission.academicYear.name}</TableCell>
                  <TableCell>{statusBadge(admission.status)}</TableCell>
                  <TableCell className="flex justify-end gap-2">
                    {admission.status === "PENDING" && (
                      <>
                        {canApprove && (
                          <ApproveAdmissionButton id={admission.id} studentName={admission.student.fullName} />
                        )}
                        {canReject && (
                          <RejectAdmissionButton id={admission.id} studentName={admission.student.fullName} />
                        )}
                        {canWithdraw && (
                          <WithdrawAdmissionButton id={admission.id} studentName={admission.student.fullName} />
                        )}
                      </>
                    )}
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
