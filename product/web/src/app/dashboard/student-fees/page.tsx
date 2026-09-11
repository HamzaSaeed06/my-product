import { apiRequest } from "@/lib/apiClient";
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
  const [students, structures, assignments] = await Promise.all([
    apiRequest<Student[]>("/api/v1/students"),
    apiRequest<FeeStructure[]>("/api/v1/fee-structures"),
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
        action={<AssignStudentFeeDialog students={activeStudents} structures={structureOptions} />}
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
                <TableHead className="text-right">Actions</TableHead>
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
                  <TableCell className="text-right">
                    <ArchiveStudentFeeButton id={a.id} />
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
