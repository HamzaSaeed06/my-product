import Link from "next/link";
import { apiRequest } from "@/lib/apiClient";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StudentSearchBox } from "./search-box";
import { CreateStudentDialog } from "./create-student-dialog";

interface Student {
  id: string;
  studentCode: string;
  fullName: string;
  phone: string | null;
  status: "ACTIVE" | "WITHDRAWN" | "ARCHIVED";
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;

  const students = await apiRequest<Student[]>(
    q ? `/api/v1/students/search?q=${encodeURIComponent(q)}` : "/api/v1/students"
  );

  return (
    <div>
      <PageHeader
        title="Students"
        description="Student identity is permanent — enrollment, class, and roll number live separately per academic year."
        action={<CreateStudentDialog />}
      />

      <div className="mb-4">
        <StudentSearchBox initialQuery={q} />
      </div>

      {students.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {q ? `No students match "${q}".` : 'No students yet. Click "Add student" to create one.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{student.studentCode}</TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/dashboard/students/${student.id}`} className="hover:underline">
                      {student.fullName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{student.phone ?? "—"}</TableCell>
                  <TableCell>
                    {student.status === "ACTIVE" ? (
                      <Badge>Active</Badge>
                    ) : student.status === "WITHDRAWN" ? (
                      <Badge variant="secondary">Withdrawn</Badge>
                    ) : (
                      <Badge variant="secondary">Archived</Badge>
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
