import { apiRequest } from "@/lib/apiClient";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreateAssignmentDialog } from "./assignment-dialogs";
import { ArchiveAssignmentButton } from "./archive-assignment-button";
import type { SectionOption } from "@/components/section-picker";

interface Assignment {
  id: string;
  teacher: { user: { fullName: string } };
  subject: { name: string };
  klass: { name: string };
  section: { name: string };
  academicYear: { name: string };
}

interface Teacher {
  id: string;
  status: "ACTIVE" | "ARCHIVED";
  user: { fullName: string };
}

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

export default async function TeacherAssignmentsPage() {
  const [assignments, teachers, subjects, rawSections, classes, campuses, academicYears] = await Promise.all([
    apiRequest<Assignment[]>("/api/v1/teacher-assignments"),
    apiRequest<Teacher[]>("/api/v1/teachers"),
    apiRequest<NamedOption[]>("/api/v1/subjects"),
    apiRequest<RawSection[]>("/api/v1/sections"),
    apiRequest<NamedOption[]>("/api/v1/classes"),
    apiRequest<NamedOption[]>("/api/v1/campuses"),
    apiRequest<NamedOption[]>("/api/v1/academic-years"),
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

  const activeTeachers = teachers
    .filter((t) => t.status === "ACTIVE")
    .map((t) => ({ id: t.id, name: t.user.fullName }));

  return (
    <div>
      <PageHeader
        title="Teacher Assignments"
        description="Which teacher teaches which subject to which section, per academic year."
        action={<CreateAssignmentDialog teachers={activeTeachers} subjects={subjects} sections={sections} />}
      />

      {assignments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No assignments yet. Click "Assign teacher" to create one.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Academic year</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.teacher.user.fullName}</TableCell>
                  <TableCell className="text-muted-foreground">{a.subject.name}</TableCell>
                  <TableCell className="text-muted-foreground">{a.klass.name}</TableCell>
                  <TableCell className="text-muted-foreground">{a.section.name}</TableCell>
                  <TableCell className="text-muted-foreground">{a.academicYear.name}</TableCell>
                  <TableCell className="text-right">
                    <ArchiveAssignmentButton id={a.id} />
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
