import { apiRequest, ApiError } from "@/lib/apiClient";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { SectionHeading } from "@/components/section-heading";
import { ExportCsvButton } from "../export-button";
import { AcademicFilters } from "./filters";
import { BarChartCard } from "../charts";
import { NoReportAccess } from "../no-access";

interface Exam {
  id: string;
  name: string;
  academicYearId: string;
}

interface RawSection {
  id: string;
  name: string;
  classId: string;
  academicYearId: string;
  archivedAt: string | null;
}

interface NamedOption {
  id: string;
  name: string;
}

interface AcademicReport {
  examName: string;
  studentPerformance: { studentId: string; studentName: string; studentCode: string; sectionName: string; percentage: number; passed: boolean }[];
  classPerformance: { sectionId: string; sectionName: string; averagePercentage: number; studentCount: number }[];
  subjectWiseAnalysis: { subjectId: string; subjectName: string; averagePercentage: number; entries: number }[];
  teacherPerformance: { teacherId: string; teacherName: string; subjectName: string; sectionId: string; averagePercentage: number | null }[];
  curriculumProgress: { sectionId: string; totalTopics: number; completedTopics: number; completionPercentage: number }[];
  passFailRates: { passed: number; failed: number; passRatePercentage: number };
}

type Props = { searchParams: Promise<{ examId?: string; sectionId?: string }> };

// The filter-support fetches (exams/sections/classes) can themselves 403
// for a role that has report.view_academic but not exam.view (Incharge)
// or campus/class.view at all (varies by role) — not just the report
// endpoint itself. Wrapping the whole page body, not just the final
// report call, is what actually catches every one of those.
export default async function AcademicReportPage(props: Props) {
  try {
    return await AcademicReportContent(props);
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) return <NoReportAccess title="Academic Report" />;
    throw err;
  }
}

async function AcademicReportContent({ searchParams }: Props) {
  const user = await getCurrentUser();
  const { examId: requestedExamId, sectionId } = await searchParams;

  const [exams, rawSections, classes] = await Promise.all([
    apiRequest<Exam[]>("/api/v1/exams"),
    apiRequest<RawSection[]>("/api/v1/sections"),
    apiRequest<NamedOption[]>("/api/v1/classes"),
  ]);
  const classNameById = new Map(classes.map((c) => [c.id, c.name]));

  if (exams.length === 0) {
    return (
      <div>
        <PageHeader title="Academic Report" description="Requires at least one exam with published results." />
        <p className="text-sm text-muted-foreground">No exams yet.</p>
      </div>
    );
  }

  const examId = exams.find((e) => e.id === requestedExamId)?.id ?? exams[0]!.id;
  const selectedExam = exams.find((e) => e.id === examId)!;
  const sectionChoices = rawSections
    .filter((s) => !s.archivedAt && s.academicYearId === selectedExam.academicYearId)
    .map((s) => ({ id: s.id, label: `${classNameById.get(s.classId) ?? "—"} ${s.name}` }));

  const report = await apiRequest<AcademicReport>(`/api/v1/reports/academic?examId=${examId}${sectionId ? `&sectionId=${sectionId}` : ""}`);

  return (
    <div>
      <PageHeader
        title="Academic Report"
        description={report.examName}
        action={
          user?.roles.includes("SUPER_ADMIN") || user?.roles.includes("CAMPUS_HEAD") || user?.roles.includes("OFFICE") ? (
            <ExportCsvButton category="academic" params={{ examId, ...(sectionId ? { sectionId } : {}) }} />
          ) : undefined
        }
      />
      <AcademicFilters exams={exams.map((e) => ({ id: e.id, name: e.name }))} sections={sectionChoices} selectedExamId={examId} selectedSectionId={sectionId ?? ""} />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Passed" value={report.passFailRates.passed} />
        <StatCard label="Failed" value={report.passFailRates.failed} />
        <StatCard label="Pass rate" value={`${report.passFailRates.passRatePercentage}%`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BarChartCard
          title="Class performance"
          data={report.classPerformance.map((c) => ({ label: c.sectionName, value: c.averagePercentage }))}
        />
        <BarChartCard
          title="Subject-wise average"
          data={report.subjectWiseAnalysis.map((s) => ({ label: s.subjectName, value: s.averagePercentage }))}
        />
      </div>

      <div className="mt-6">
        <SectionHeading>Student performance</SectionHeading>
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.studentPerformance.map((s) => (
                <TableRow key={s.studentId}>
                  <TableCell className="font-medium">
                    {s.studentName} <span className="font-mono text-xs text-muted-foreground">({s.studentCode})</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{s.sectionName}</TableCell>
                  <TableCell>{s.percentage}%</TableCell>
                  <TableCell>
                    <Badge variant={s.passed ? "default" : "destructive"}>{s.passed ? "Pass" : "Fail"}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {report.studentPerformance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                    No published results for this selection yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>

      {report.teacherPerformance.length > 0 ? (
        <div className="mt-6">
          <SectionHeading>Teacher performance</SectionHeading>
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Average</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.teacherPerformance.map((t, i) => (
                  <TableRow key={`${t.teacherId}-${t.sectionId}-${i}`}>
                    <TableCell className="font-medium">{t.teacherName}</TableCell>
                    <TableCell className="text-muted-foreground">{t.subjectName}</TableCell>
                    <TableCell>{t.averagePercentage !== null ? `${t.averagePercentage}%` : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}

      {report.curriculumProgress.length > 0 ? (
        <div className="mt-6">
          <SectionHeading>Curriculum progress</SectionHeading>
          <div className="flex flex-wrap gap-2">
            {report.curriculumProgress.map((c) => (
              <div key={c.sectionId} className="rounded-md bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground">
                {c.completedTopics}/{c.totalTopics} topics ({c.completionPercentage}%)
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
