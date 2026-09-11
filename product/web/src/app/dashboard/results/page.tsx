import Link from "next/link";
import { apiRequest } from "@/lib/apiClient";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { ResultsFilters } from "./filters";
import { EnterItemDialog } from "./enter-item-dialog";
import { StatusActionButton } from "./status-action-button";
import { RequestResultCorrectionDialog } from "./correction-dialog";
import { DecideResultCorrectionButtons } from "./decide-correction-buttons";

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
  academicYearId: string;
}

interface ResultItem {
  id: string;
  marksObtained: number;
  totalMarks: number;
  grade: string | null;
  subject: { name: string };
}

interface Result {
  id: string;
  status: "DRAFT" | "SUBMITTED" | "REVIEWED" | "FINALIZED" | "PUBLISHED";
  student: { id: string; fullName: string; studentCode: string };
  items: ResultItem[];
}

interface ApprovalRequest {
  id: string;
  type: string;
  payload: { resultItemId: string; oldMarks: number; newMarks: number; reason: string };
  requestedBy: { fullName: string };
}

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ examId?: string; sectionId?: string }>;
}) {
  const { examId: requestedExamId, sectionId: requestedSectionId } = await searchParams;

  const [exams, rawSections, classes, campuses, academicYears, subjects, pendingApprovals] = await Promise.all([
    apiRequest<Exam[]>("/api/v1/exams"),
    apiRequest<RawSection[]>("/api/v1/sections"),
    apiRequest<NamedOption[]>("/api/v1/classes"),
    apiRequest<NamedOption[]>("/api/v1/campuses"),
    apiRequest<NamedOption[]>("/api/v1/academic-years"),
    apiRequest<NamedOption[]>("/api/v1/subjects"),
    apiRequest<ApprovalRequest[]>("/api/v1/approvals?status=PENDING"),
  ]);

  const classNameById = new Map(classes.map((c) => [c.id, c.name]));
  const campusNameById = new Map(campuses.map((c) => [c.id, c.name]));
  const yearNameById = new Map(academicYears.map((y) => [y.id, y.name]));

  const resultCorrections = pendingApprovals.filter((a) => a.type === "RESULT_CORRECTION");

  if (exams.length === 0) {
    return (
      <div>
        <PageHeader title="Results" description="Enter marks, then submit, review, finalize, and publish." />
        <p className="text-sm text-muted-foreground">Create an exam first.</p>
      </div>
    );
  }

  const selectedExamId = exams.find((e) => e.id === requestedExamId)?.id ?? exams[0]!.id;
  const selectedExam = exams.find((e) => e.id === selectedExamId)!;

  const sectionChoices = rawSections
    .filter((s) => !s.archivedAt && s.academicYearId === selectedExam.academicYearId)
    .map((s) => ({
      id: s.id,
      label: `${classNameById.get(s.classId) ?? "—"} ${s.name} · ${campusNameById.get(s.campusId) ?? "—"}`,
    }));

  return (
    <div>
      <PageHeader title="Results" description="Enter marks, then submit, review, finalize, and publish." />

      <ResultsFilters
        exams={exams.map((e) => ({ id: e.id, name: `${e.name} (${yearNameById.get(e.academicYearId) ?? "—"})` }))}
        sections={sectionChoices}
        selectedExamId={selectedExamId}
        selectedSectionId={sectionChoices.find((s) => s.id === requestedSectionId)?.id ?? sectionChoices[0]?.id ?? ""}
      />

      {sectionChoices.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sections exist for this exam&apos;s academic year yet.</p>
      ) : (
        <ResultsBody
          examId={selectedExamId}
          sectionId={sectionChoices.find((s) => s.id === requestedSectionId)?.id ?? sectionChoices[0]!.id}
          subjects={subjects}
        />
      )}

      {resultCorrections.length > 0 ? (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Pending result corrections</h2>
          <div className="flex flex-col gap-3">
            {resultCorrections.map((approval) => (
              <div key={approval.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="text-sm">
                  <p className="text-foreground">
                    {approval.payload.oldMarks} → {approval.payload.newMarks}
                  </p>
                  <p className="text-muted-foreground">
                    Requested by {approval.requestedBy.fullName}: &ldquo;{approval.payload.reason}&rdquo;
                  </p>
                </div>
                <DecideResultCorrectionButtons approvalId={approval.id} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

async function ResultsBody({ examId, sectionId, subjects }: { examId: string; sectionId: string; subjects: NamedOption[] }) {
  const results = await apiRequest<Result[]>(`/api/v1/results?examId=${examId}&sectionId=${sectionId}`);

  if (results.length === 0) {
    return <p className="text-sm text-muted-foreground">No actively enrolled students in this section.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {results.map((result) => (
        <div key={result.id} className="rounded-lg border border-border p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{result.student.fullName}</p>
              <p className="font-mono text-xs text-muted-foreground">{result.student.studentCode}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={result.status === "PUBLISHED" ? "default" : "secondary"}>{result.status}</Badge>
              <StatusActionButton resultId={result.id} status={result.status} />
              {result.status === "FINALIZED" || result.status === "PUBLISHED" ? (
                <Link href="/dashboard/report-cards" className="text-xs text-muted-foreground hover:underline">
                  Report cards →
                </Link>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {result.items.map((item) => (
              <div key={item.id} className="flex items-center gap-2 rounded-md bg-secondary/50 px-3 py-1.5 text-xs">
                <span className="font-medium text-foreground">{item.subject.name}:</span>
                <span className="text-muted-foreground">
                  {item.marksObtained}/{item.totalMarks} {item.grade ? `(${item.grade})` : ""}
                </span>
                {result.status === "FINALIZED" || result.status === "PUBLISHED" ? (
                  <RequestResultCorrectionDialog itemId={item.id} currentMarks={item.marksObtained} totalMarks={item.totalMarks} />
                ) : null}
              </div>
            ))}
            {result.status === "DRAFT" ? <EnterItemDialog resultId={result.id} subjects={subjects} /> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
