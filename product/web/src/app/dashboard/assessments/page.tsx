import Link from "next/link";
import { apiRequest } from "@/lib/apiClient";
import { getCurrentUser } from "@/lib/session";
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
  // Mirrors assessment.create/edit from routes.ts. Incharge holds
  // assessment.view + assessment.correct only (correction happens on the
  // assessment detail page, not here) — no create, no edit/archive. Same
  // crash class as Leaves/Complaints/Substitutions/Homework: the
  // sections/classes/campuses/academic-years/subjects/teachers fetches
  // exist solely to feed the Create dialog, and campus.view/
  // academic_year.view/subject.view aren't in Incharge's grant either.
  const permissions = (await getCurrentUser())?.permissions ?? [];
  const canCreate = permissions.includes("assessment.create");
  const canEdit = permissions.includes("assessment.edit");

  const [assessments, rawSections, classes, campuses, academicYears, subjects, teachers] = await Promise.all([
    apiRequest<Assessment[]>("/api/v1/assessments"),
    canCreate ? apiRequest<RawSection[]>("/api/v1/sections") : Promise.resolve<RawSection[]>([]),
    canCreate ? apiRequest<NamedOption[]>("/api/v1/classes") : Promise.resolve<NamedOption[]>([]),
    canCreate ? apiRequest<NamedOption[]>("/api/v1/campuses") : Promise.resolve<NamedOption[]>([]),
    canCreate ? apiRequest<NamedOption[]>("/api/v1/academic-years") : Promise.resolve<NamedOption[]>([]),
    canCreate ? apiRequest<NamedOption[]>("/api/v1/subjects") : Promise.resolve<NamedOption[]>([]),
    canCreate ? apiRequest<Teacher[]>("/api/v1/teachers") : Promise.resolve<Teacher[]>([]),
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
        action={canCreate ? <CreateAssessmentDialog sections={sections} subjects={subjects} teachers={activeTeachers} /> : undefined}
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
                {canEdit ? <TableHead className="text-right">Actions</TableHead> : null}
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
                  {canEdit ? (
                    <TableCell className="text-right">
                      <ArchiveAssessmentButton id={a.id} />
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
