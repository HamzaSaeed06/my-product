import { apiRequest } from "@/lib/apiClient";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AssignStudentFeeDialog } from "./assign-dialog";
import { ArchiveStudentFeeButton } from "./archive-button";

interface Student {
  id: string;
  fullName: string;
  studentCode: string;
  status: "ACTIVE" | "WITHDRAWN" | "ARCHIVED";
}

interface FeeStructure {
  id: string;
  name: string;
  amount: string;
  klass: { name: string };
}

interface StudentFee {
  id: string;
  overrideAmount: string | null;
  feeStructure: { name: string; amount: string; klass: { name: string }; feeCategory: { name: string } };
}

export default async function StudentFeesPage() {
  // Mirrors fee_assignment.create/fee_assignment.edit from routes.ts — the
  // archive endpoint requires fee_assignment.edit, not a separate archive
  // key. `students`/`structures` are fetched only to feed the assign
  // dialog's pickers, so both are gated behind canCreate; the students
  // fetch also labels each row via studentById, so it degrades to the
  // table's existing "—" fallback for a viewer who lacks canCreate rather
  // than crashing.
  const currentUser = await getCurrentUser();
  const permissions = currentUser?.permissions ?? [];
  const canCreate = permissions.includes("fee_assignment.create");
  const canEdit = permissions.includes("fee_assignment.edit");

  const [students, structures, assignments] = await Promise.all([
    canCreate ? apiRequest<Student[]>("/api/v1/students") : Promise.resolve<Student[]>([]),
    canCreate ? apiRequest<FeeStructure[]>("/api/v1/fee-structures") : Promise.resolve<FeeStructure[]>([]),
    apiRequest<(StudentFee & { studentId: string })[]>("/api/v1/student-fees"),
  ]);

  const activeStudents = students.filter((s) => s.status === "ACTIVE");
  const studentById = new Map(activeStudents.map((s) => [s.id, s]));

  const structureOptions = structures.map((s) => ({ id: s.id, label: `${s.name} · ${s.klass.name} · ${s.amount}` }));

  return (
    <div>
      <PageHeader
        title="Student Fees"
        description="Assign a fee structure to a student, with an optional override amount."
        action={canCreate ? <AssignStudentFeeDialog students={activeStudents} structures={structureOptions} /> : undefined}
      />

      {assignments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No fee assignments yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Fee Structure</TableHead>
                <TableHead>Amount</TableHead>
                {canEdit ? <TableHead className="text-right">Actions</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{studentById.get(a.studentId)?.fullName ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {a.feeStructure.name} ({a.feeStructure.klass.name})
                  </TableCell>
                  <TableCell className="text-muted-foreground">{a.overrideAmount ?? a.feeStructure.amount}</TableCell>
                  {canEdit ? (
                    <TableCell className="text-right">
                      <ArchiveStudentFeeButton id={a.id} />
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
