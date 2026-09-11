import { apiRequest } from "@/lib/apiClient";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreateHomeworkDialog } from "./create-dialog";
import { PublishHomeworkButton } from "./publish-button";
import { ArchiveHomeworkButton } from "./archive-button";
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

interface Homework {
  id: string;
  title: string;
  dueDate: string;
  status: "DRAFT" | "PUBLISHED";
  subject: { name: string };
  section: { name: string };
  teacher: { user: { fullName: string } };
  document: { originalName: string } | null;
}

export default async function HomeworkPage() {
  const [homework, rawSections, classes, campuses, academicYears, subjects, teachers] = await Promise.all([
    apiRequest<Homework[]>("/api/v1/homework"),
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
        title="Homework"
        description="Create homework for a section, attach a file, and publish when ready."
        action={<CreateHomeworkDialog sections={sections} subjects={subjects} teachers={activeTeachers} />}
      />

      {homework.length === 0 ? (
        <p className="text-sm text-muted-foreground">No homework yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {homework.map((hw) => (
                <TableRow key={hw.id}>
                  <TableCell className="font-medium">
                    {hw.title}
                    {hw.document ? <span className="ml-2 text-xs text-muted-foreground">📎</span> : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{hw.section.name}</TableCell>
                  <TableCell className="text-muted-foreground">{hw.subject.name}</TableCell>
                  <TableCell className="text-muted-foreground">{hw.teacher.user.fullName}</TableCell>
                  <TableCell className="text-muted-foreground">{hw.dueDate.slice(0, 10)}</TableCell>
                  <TableCell>
                    {hw.status === "PUBLISHED" ? <Badge>Published</Badge> : <Badge variant="secondary">Draft</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {hw.status === "DRAFT" ? <PublishHomeworkButton id={hw.id} /> : null}
                      <ArchiveHomeworkButton id={hw.id} />
                    </div>
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
