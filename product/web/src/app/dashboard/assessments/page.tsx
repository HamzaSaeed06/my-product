import Link from "next/link";
import { apiRequest } from "@/lib/apiClient";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreateAssessmentDialog } from "./create-dialog";
import { ArchiveAssessmentButton } from "./archive-button";
import type { SectionOption } from "@/components/section-picker";

interface NamedOption {
  id: string;
  name: string;
}

interface RawSection {
  id: string;
  name: string;
  classId: string;
  campusId: string;
  academicYearId: string;
  archivedAt: string | null;
}

interface Teacher {
  id: string;
  status: "ACTIVE" | "ARCHIVED";
  user: { fullName: string };
}

interface Assessment {
  id: string;
  title: string;
  totalMarks: number;
  assessmentDate: string;
  status: "DRAFT" | "SUBMITTED";
  subject: { name: string };
  section: { name: string };
  teacher: { user: { fullName: string } };
}

export default async function AssessmentsPage() {
  const [assessments, rawSections, classes, campuses, academicYears, subjects, teachers] = await Promise.all([
    apiRequest<Assessment[]>("/api/v1/assessments"),
    apiRequest<RawSection[]>("/api/v1/sections"),
    apiRequest<NamedOption[]>("/api/v1/classes"),
    apiRequest<NamedOption[]>("/api/v1/campuses"),
    apiRequest<NamedOption[]>("/api/v1/academic-years"),
    apiRequest<NamedOption[]>("/api/v1/subjects"),
    apiRequest<Teacher[]>("/api/v1/teachers"),
  ]);

  const classNameById = new Map(classes.map((c) => [c.id, c.name]));
  const campusNameById = new Map(campuses.map((c) => [c.id, c.name]));
  const yearNameById = new Map(academicYears.map((y) => [y.id, y.name]));

  const sections: SectionOption[] = rawSections
    .filter((s) => !s.archivedAt)
    .map((s) => ({
      id: s.id,
      name: s.name,
      classId: s.classId,
      className: classNameById.get(s.classId) ?? "—",
      campusName: campusNameById.get(s.campusId) ?? "—",
      academicYearId: s.academicYearId,
      academicYearName: yearNameById.get(s.academicYearId) ?? "—",
    }));

  const activeTeachers = teachers.filter((t) => t.status === "ACTIVE").map((t) => ({ id: t.id, name: t.user.fullName }));

  return (
    <div>
      <PageHeader
        title="Assessments"
        description="Create tests/quizzes, enter marks, then submit to lock them."
        action={<CreateAssessmentDialog sections={sections} subjects={subjects} teachers={activeTeachers} />}
      />

      {assessments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No assessments yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Total Marks</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assessments.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">
                    <Link href={`/dashboard/assessments/${a.id}`} className="hover:underline">
                      {a.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{a.section.name}</TableCell>
                  <TableCell className="text-muted-foreground">{a.subject.name}</TableCell>
                  <TableCell className="text-muted-foreground">{a.totalMarks}</TableCell>
                  <TableCell className="text-muted-foreground">{a.assessmentDate.slice(0, 10)}</TableCell>
                  <TableCell>
                    {a.status === "SUBMITTED" ? <Badge variant="secondary">Locked</Badge> : <Badge>Draft</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <ArchiveAssessmentButton id={a.id} />
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
