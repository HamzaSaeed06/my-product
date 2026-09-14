import { PageHeader } from "@/components/page-header";
import { mockExams } from "@/lib/mock/exams";
import { mockSubjects } from "@/lib/mock/subjects";
import { getStudentById } from "@/lib/mock/students";
import type { ReportCard } from "@/lib/mock/report-cards";

export function ReportCardView({ reportCard }: { reportCard: ReportCard }) {
  const student = getStudentById(reportCard.studentId);
  const exam = mockExams.find((e) => e.id === reportCard.examId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Report card — ${student?.fullName ?? reportCard.studentId}`}
        description={`${exam?.name} · Generated ${new Date(reportCard.generatedAt).toLocaleDateString()} · A snapshot, not live-computed`}
      />

      <div className="surface-ring overflow-hidden rounded-[var(--card-radius)]">
        <div className="divide-y divide-border">
          {reportCard.snapshot.map((item) => (
            <div key={item.subjectId} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm text-foreground">{mockSubjects.find((s) => s.id === item.subjectId)?.name}</span>
              <span className="font-mono text-sm text-foreground">
                {item.marksObtained ?? "—"} / {item.maxMarks}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between bg-muted/40 px-4 py-2.5">
            <span className="text-sm font-medium text-foreground">Total</span>
            <span className="font-mono text-sm font-medium text-foreground">
              {reportCard.totalObtained} / {reportCard.totalMax}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
