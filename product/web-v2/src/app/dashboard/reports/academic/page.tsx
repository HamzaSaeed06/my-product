"use client";

import { PageHeader } from "@/components/page-header";
import { StatStrip } from "@/components/stat-tile";
import { ExportButton } from "@/components/export-button";
import { mockResultItems } from "@/lib/mock/results";
import { mockSubjects } from "@/lib/mock/subjects";
import { mockCurriculumProgress } from "@/lib/mock/curriculum";
import { mockHomework } from "@/lib/mock/homework";

export default function AcademicReportPage() {
  const gradedItems = mockResultItems.filter((i) => i.marksObtained !== null);
  const avgPct = gradedItems.length ? gradedItems.reduce((sum, i) => sum + (i.marksObtained! / i.maxMarks) * 100, 0) / gradedItems.length : 0;
  const curriculumDone = mockCurriculumProgress.filter((p) => p.completedAt).length;
  const curriculumPct = mockCurriculumProgress.length ? (curriculumDone / mockCurriculumProgress.length) * 100 : 0;
  const publishedHomework = mockHomework.filter((h) => h.status === "PUBLISHED").length;

  const bySubject = Array.from(new Set(gradedItems.map((i) => i.subjectId))).map((subjectId) => {
    const items = gradedItems.filter((i) => i.subjectId === subjectId);
    const avg = items.reduce((sum, i) => sum + (i.marksObtained! / i.maxMarks) * 100, 0) / items.length;
    return { subjectId, avg, count: items.length };
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Academic Report"
        description="Results and curriculum progress across classes — computed live from Results and Curriculum."
        actions={<ExportButton filename="academic-report.csv" rows={[["Subject", "Average %", "Graded"], ...bySubject.map((s) => [mockSubjects.find((sub) => sub.id === s.subjectId)?.name ?? s.subjectId, s.avg.toFixed(1), s.count])]} />}
      />
      <StatStrip
        entries={[
          { label: "Assessments graded", value: gradedItems.length },
          { label: "Average score", value: `${avgPct.toFixed(1)}%` },
          { label: "Curriculum complete", value: `${curriculumPct.toFixed(0)}%` },
          { label: "Homework published", value: publishedHomework },
        ]}
      />
      <div className="surface-ring overflow-hidden rounded-[var(--card-radius)]">
        <div className="divide-y divide-border">
          {bySubject.map((s) => (
            <div key={s.subjectId} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm text-foreground">{mockSubjects.find((sub) => sub.id === s.subjectId)?.name}</span>
              <span className="font-mono text-sm text-muted-foreground">{s.avg.toFixed(1)}% avg · {s.count} graded</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
