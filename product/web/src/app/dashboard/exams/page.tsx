import Link from "next/link";
import { apiRequest } from "@/lib/apiClient";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreateExamDialog } from "./create-dialog";
import { PublishExamButton } from "./publish-button";

interface NamedOption {
  id: string;
  name: string;
}

interface Exam {
  id: string;
  name: string;
  status: "DRAFT" | "PUBLISHED";
  academicYearId: string;
}

export default async function ExamsPage() {
  const [exams, academicYears] = await Promise.all([
    apiRequest<Exam[]>("/api/v1/exams"),
    apiRequest<NamedOption[]>("/api/v1/academic-years"),
  ]);

  const yearNameById = new Map(academicYears.map((y) => [y.id, y.name]));

  return (
    <div>
      <PageHeader
        title="Exams"
        description="Create an exam series, schedule papers per section, then publish."
        action={<CreateExamDialog academicYears={academicYears} />}
      />

      {exams.length === 0 ? (
        <p className="text-sm text-muted-foreground">No exams yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell className="font-medium">
                    <Link href={`/dashboard/exams/${exam.id}`} className="hover:underline">
                      {exam.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{yearNameById.get(exam.academicYearId) ?? "—"}</TableCell>
                  <TableCell>
                    {exam.status === "PUBLISHED" ? <Badge>Published</Badge> : <Badge variant="secondary">Draft</Badge>}
                  </TableCell>
                  <TableCell className="text-right">{exam.status === "DRAFT" ? <PublishExamButton id={exam.id} /> : null}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
