import Link from "next/link";
import { apiRequest } from "@/lib/apiClient";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportCardFilters } from "./filters";
import { GenerateReportCardButton } from "./generate-button";

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

interface Result {
  id: string;
  status: "DRAFT" | "SUBMITTED" | "REVIEWED" | "FINALIZED" | "PUBLISHED";
  student: { id: string; fullName: string; studentCode: string };
}

interface ReportCard {
  id: string;
  result: { id: string };
}

export default async function ReportCardsPage({
  searchParams,
}: {
  searchParams: Promise<{ examId?: string; sectionId?: string }>;
}) {
  const { examId: requestedExamId, sectionId: requestedSectionId } = await searchParams;

  // report_card.generate is the module's only write route (no separate
  // edit/archive) — gates the Generate/Regenerate button.
  const canGenerate = ((await getCurrentUser())?.permissions ?? []).includes("report_card.generate");

  const [exams, rawSections, classes, campuses] = await Promise.all([
    apiRequest<Exam[]>("/api/v1/exams"),
    apiRequest<RawSection[]>("/api/v1/sections"),
    apiRequest<NamedOption[]>("/api/v1/classes"),
    apiRequest<NamedOption[]>("/api/v1/campuses"),
  ]);

  if (exams.length === 0) {
    return (
      <div>
        <PageHeader title="Report Cards" description="Generate a report card for a finalized or published result." />
        <p className="text-sm text-muted-foreground">Create an exam first.</p>
      </div>
    );
  }

  const classNameById = new Map(classes.map((c) => [c.id, c.name]));
  const campusNameById = new Map(campuses.map((c) => [c.id, c.name]));

  const selectedExamId = exams.find((e) => e.id === requestedExamId)?.id ?? exams[0]!.id;
  const selectedExam = exams.find((e) => e.id === selectedExamId)!;

  const sectionChoices = rawSections
    .filter((s) => !s.archivedAt && s.academicYearId === selectedExam.academicYearId)
    .map((s) => ({ id: s.id, label: `${classNameById.get(s.classId) ?? "—"} ${s.name} · ${campusNameById.get(s.campusId) ?? "—"}` }));

  return (
    <div>
      <PageHeader title="Report Cards" description="Generate a report card for a finalized or published result." />

      <ReportCardFilters
        exams={exams.map((e) => ({ id: e.id, name: e.name }))}
        sections={sectionChoices}
        selectedExamId={selectedExamId}
        selectedSectionId={sectionChoices.find((s) => s.id === requestedSectionId)?.id ?? sectionChoices[0]?.id ?? ""}
      />

      {sectionChoices.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sections exist for this exam&apos;s academic year yet.</p>
      ) : (
        <ReportCardsBody
          examId={selectedExamId}
          sectionId={sectionChoices.find((s) => s.id === requestedSectionId)?.id ?? sectionChoices[0]!.id}
          canGenerate={canGenerate}
        />
      )}
    </div>
  );
}

async function ReportCardsBody({
  examId,
  sectionId,
  canGenerate,
}: {
  examId: string;
  sectionId: string;
  canGenerate: boolean;
}) {
  const [results, reportCards] = await Promise.all([
    apiRequest<Result[]>(`/api/v1/results?examId=${examId}&sectionId=${sectionId}`),
    apiRequest<ReportCard[]>(`/api/v1/report-cards?examId=${examId}`),
  ]);

  const reportCardByResultId = new Map(reportCards.map((rc) => [rc.result.id, rc]));
  const eligible = results.filter((r) => r.status === "FINALIZED" || r.status === "PUBLISHED");

  if (eligible.length === 0) {
    return <p className="text-sm text-muted-foreground">No finalized or published results in this section yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {eligible.map((result) => {
            const reportCard = reportCardByResultId.get(result.id);
            return (
              <TableRow key={result.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">{result.student.studentCode}</TableCell>
                <TableCell className="font-medium">{result.student.fullName}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {reportCard ? (
                      <Link href={`/dashboard/report-cards/${reportCard.id}`} className="text-sm text-foreground hover:underline">
                        View
                      </Link>
                    ) : null}
                    {canGenerate ? (
                      <GenerateReportCardButton resultId={result.id} regenerate={!!reportCard} />
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
