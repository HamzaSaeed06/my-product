import { apiRequest } from "@/lib/apiClient";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AddScheduleDialog } from "./schedule-dialog";
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

interface Exam {
  id: string;
  name: string;
  status: "DRAFT" | "PUBLISHED";
  academicYearId: string;
}

interface ExamSchedule {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string | null;
  subject: { name: string };
  klass: { name: string };
  section: { name: string };
}

export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;

  const exam = await apiRequest<Exam>(`/api/v1/exams/${examId}`);

  const [schedules, rawSections, classes, campuses, academicYears, subjects] = await Promise.all([
    apiRequest<ExamSchedule[]>(`/api/v1/exam-schedules?examId=${examId}`),
    apiRequest<RawSection[]>("/api/v1/sections"),
    apiRequest<NamedOption[]>("/api/v1/classes"),
    apiRequest<NamedOption[]>("/api/v1/campuses"),
    apiRequest<NamedOption[]>("/api/v1/academic-years"),
    apiRequest<NamedOption[]>("/api/v1/subjects"),
  ]);

  const classNameById = new Map(classes.map((c) => [c.id, c.name]));
  const campusNameById = new Map(campuses.map((c) => [c.id, c.name]));
  const yearNameById = new Map(academicYears.map((y) => [y.id, y.name]));

  const sections: SectionOption[] = rawSections
    .filter((s) => !s.archivedAt && s.academicYearId === exam.academicYearId)
    .map((s) => ({
      id: s.id,
      name: s.name,
      classId: s.classId,
      className: classNameById.get(s.classId) ?? "—",
      campusName: campusNameById.get(s.campusId) ?? "—",
      academicYearId: s.academicYearId,
      academicYearName: yearNameById.get(s.academicYearId) ?? "—",
    }));

  return (
    <div>
      <PageHeader
        title={exam.name}
        description={`${yearNameById.get(exam.academicYearId) ?? "—"} · ${exam.status === "PUBLISHED" ? "Published" : "Draft"}`}
        action={<AddScheduleDialog examId={examId} sections={sections} subjects={subjects} />}
      />

      {schedules.length === 0 ? (
        <p className="text-sm text-muted-foreground">No papers scheduled yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Room</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-muted-foreground">{s.date.slice(0, 10)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.startTime}–{s.endTime}
                  </TableCell>
                  <TableCell className="font-medium">{s.subject.name}</TableCell>
                  <TableCell className="text-muted-foreground">{s.klass.name}</TableCell>
                  <TableCell className="text-muted-foreground">{s.section.name}</TableCell>
                  <TableCell className="text-muted-foreground">{s.room ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {exam.status === "DRAFT" ? (
        <p className="mt-4 text-xs text-muted-foreground">
          <Badge variant="secondary">Draft</Badge> — publish this exam from the Exams list once the schedule is complete.
        </p>
      ) : null}
    </div>
  );
}
