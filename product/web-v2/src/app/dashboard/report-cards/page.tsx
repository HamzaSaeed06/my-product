"use client";

import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/combobox";
import { StatusDot } from "@/components/status-dot";
import { mockExams } from "@/lib/mock/exams";
import { mockSections, getSectionRoster } from "@/lib/mock/sections";
import { mockClasses } from "@/lib/mock/classes";
import { mockResults, mockResultItems } from "@/lib/mock/results";
import { mockReportCards, type ReportCard } from "@/lib/mock/report-cards";

const EXAM_OPTIONS = mockExams.map((e) => ({ value: e.id, label: e.name }));
const SECTION_OPTIONS = mockSections
  .filter((s) => !s.archived)
  .map((s) => ({ value: s.id, label: `${mockClasses.find((c) => c.id === s.classId)?.name} ${s.name}` }));

const LOCKED_STATUSES = new Set(["FINALIZED", "PUBLISHED"]);

export default function ReportCardsPage() {
  const [examId, setExamId] = useState<string | null>("exam_1");
  const [sectionId, setSectionId] = useState<string | null>("sec_2");
  const [reportCards, setReportCards] = useState<ReportCard[]>(mockReportCards);

  const roster = sectionId ? getSectionRoster(sectionId) : [];
  const results = mockResults.filter((r) => r.examId === examId && r.sectionId === sectionId);

  function generate(resultId: string) {
    const result = results.find((r) => r.id === resultId);
    if (!result) return;
    const snapshot = mockResultItems
      .filter((i) => i.resultId === resultId)
      .map((i) => ({ subjectId: i.subjectId, marksObtained: i.marksObtained, maxMarks: i.maxMarks }));
    const card: ReportCard = {
      id: `rc_${resultId}`,
      resultId,
      studentId: result.studentId,
      examId: result.examId,
      generatedAt: new Date().toISOString(),
      snapshot,
      totalObtained: snapshot.reduce((sum, s) => sum + (s.marksObtained ?? 0), 0),
      totalMax: snapshot.reduce((sum, s) => sum + s.maxMarks, 0),
    };
    setReportCards((prev) => (prev.some((rc) => rc.resultId === resultId) ? prev.map((rc) => (rc.resultId === resultId ? card : rc)) : [...prev, card]));
    toast.success("Report card generated.");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Report Cards"
        description="A snapshot taken at generation time, not live-computed — only generatable once a student's Result is Finalized or Published."
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Exam</span>
        <Combobox options={EXAM_OPTIONS} value={examId} onChange={setExamId} placeholder="Select an exam" className="w-48" />
        <span className="ml-2 text-sm text-muted-foreground">Section</span>
        <Combobox options={SECTION_OPTIONS} value={sectionId} onChange={setSectionId} placeholder="Select a section" className="w-56" />
      </div>

      {results.length === 0 ? (
        <p className="text-sm text-muted-foreground">No results exist yet for this exam and section — generate results first.</p>
      ) : (
        <div className="surface-ring overflow-hidden rounded-[var(--card-radius)]">
          <div className="divide-y divide-border">
            {results.map((result) => {
              const student = roster.find((s) => s.id === result.studentId);
              const card = reportCards.find((rc) => rc.resultId === result.id);
              const locked = LOCKED_STATUSES.has(result.status);
              return (
                <div key={result.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{student?.fullName ?? result.studentId}</span>
                    <span className="font-mono text-xs text-muted-foreground">{student?.admissionNo}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusDot tone={locked ? "success" : "neutral"}>{result.status.charAt(0) + result.status.slice(1).toLowerCase()}</StatusDot>
                    {card && (
                      <Button variant="ghost" size="sm" render={<Link href={`/dashboard/report-cards/${card.id}`} />}>
                        View
                      </Button>
                    )}
                    <Button size="sm" variant={card ? "outline" : "default"} disabled={!locked} onClick={() => generate(result.id)}>
                      {card ? "Regenerate" : "Generate"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
