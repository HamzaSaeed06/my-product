"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/combobox";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ListChecks } from "lucide-react";
import { mockExams, mockExamSchedules } from "@/lib/mock/exams";
import { mockSections, getSectionRoster } from "@/lib/mock/sections";
import { mockClasses } from "@/lib/mock/classes";
import { mockResults, mockResultItems, RESULT_STAGE_ORDER, type Result, type ResultItem } from "@/lib/mock/results";
import { ResultRow } from "./result-row";

const EXAM_OPTIONS = mockExams.map((e) => ({ value: e.id, label: e.name }));
const SECTION_OPTIONS = mockSections
  .filter((s) => !s.archived)
  .map((s) => ({ value: s.id, label: `${mockClasses.find((c) => c.id === s.classId)?.name} ${s.name}` }));

export default function ResultsPage() {
  const [examId, setExamId] = useState<string | null>("exam_1");
  const [sectionId, setSectionId] = useState<string | null>("sec_2");
  const [results, setResults] = useState<Result[]>(mockResults);
  const [items, setItems] = useState<ResultItem[]>(mockResultItems);

  const roster = sectionId ? getSectionRoster(sectionId) : [];
  const filteredResults = results.filter((r) => r.examId === examId && r.sectionId === sectionId);
  const examSubjectIds = mockExamSchedules.filter((s) => s.examId === examId && s.sectionId === sectionId).map((s) => s.subjectId);

  function generateResults() {
    if (!examId || !sectionId) return;
    const newResults: Result[] = roster.map((s) => ({ id: `res_${s.id}_${examId}`, studentId: s.id, examId, sectionId, status: "DRAFT" }));
    const newItems: ResultItem[] = newResults.flatMap((r) =>
      examSubjectIds.map((subjectId) => ({ id: `ri_${r.id}_${subjectId}`, resultId: r.id, subjectId, marksObtained: null, maxMarks: 100 })),
    );
    setResults((prev) => [...prev, ...newResults]);
    setItems((prev) => [...prev, ...newItems]);
    toast.success(`Draft results generated for ${roster.length} students.`);
  }

  function advance(resultId: string) {
    setResults((prev) =>
      prev.map((r) => {
        if (r.id !== resultId) return r;
        const nextIndex = RESULT_STAGE_ORDER.indexOf(r.status) + 1;
        return nextIndex < RESULT_STAGE_ORDER.length ? { ...r, status: RESULT_STAGE_ORDER[nextIndex] } : r;
      }),
    );
    toast.success("Result advanced to the next stage.");
  }

  function saveMarks(resultId: string, marks: Record<string, number | null>) {
    setItems((prev) => prev.map((i) => (i.resultId === resultId && i.id in marks ? { ...i, marksObtained: marks[i.id] } : i)));
    toast.success("Marks saved.");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Results"
        description="One row per student per exam. A strict, one-way pipeline — Draft → Submitted → Reviewed → Finalized → Published — locked after Draft except via a correction approval."
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Exam</span>
        <Combobox options={EXAM_OPTIONS} value={examId} onChange={setExamId} placeholder="Select an exam" className="w-48" />
        <span className="ml-2 text-sm text-muted-foreground">Section</span>
        <Combobox options={SECTION_OPTIONS} value={sectionId} onChange={setSectionId} placeholder="Select a section" className="w-56" />
      </div>

      {filteredResults.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ListChecks />
            </EmptyMedia>
            <EmptyTitle>No results yet for this exam and section</EmptyTitle>
            <EmptyDescription>Generate a blank draft result for every enrolled student to start entering marks.</EmptyDescription>
          </EmptyHeader>
          <Button size="sm" onClick={generateResults} disabled={roster.length === 0 || examSubjectIds.length === 0}>
            Generate results
          </Button>
        </Empty>
      ) : (
        <div className="surface-ring overflow-hidden rounded-[var(--card-radius)]">
          <div className="divide-y divide-border">
            {filteredResults.map((result) => {
              const student = roster.find((s) => s.id === result.studentId);
              if (!student) return null;
              return (
                <ResultRow
                  key={result.id}
                  student={student}
                  result={result}
                  items={items.filter((i) => i.resultId === result.id)}
                  onAdvance={advance}
                  onSaveMarks={saveMarks}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
