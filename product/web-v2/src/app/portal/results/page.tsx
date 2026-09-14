"use client";

import { PageHeader } from "@/components/page-header";
import { getStudentById } from "@/lib/mock/students";
import { mockExams } from "@/lib/mock/exams";
import { mockSubjects } from "@/lib/mock/subjects";
import { mockResults, mockResultItems } from "@/lib/mock/results";
import { usePortal } from "../portal-context";

export default function PortalResultsPage() {
  const { activeChildId } = usePortal();
  const student = getStudentById(activeChildId);
  const results = mockResults.filter((r) => r.studentId === activeChildId && r.status === "PUBLISHED");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Results" description={`${student?.fullName}'s results — only published results are visible here.`} />
      {results.length === 0 ? (
        <p className="text-sm text-muted-foreground">No published results yet.</p>
      ) : (
        results.map((result) => {
          const items = mockResultItems.filter((i) => i.resultId === result.id);
          const total = items.reduce((sum, i) => sum + (i.marksObtained ?? 0), 0);
          const maxTotal = items.reduce((sum, i) => sum + i.maxMarks, 0);
          return (
            <div key={result.id} className="flex flex-col gap-2">
              <span className="label-eyebrow text-muted-foreground">{mockExams.find((e) => e.id === result.examId)?.name}</span>
              <div className="surface-ring flex flex-col divide-y divide-border overflow-hidden rounded-[var(--card-radius)]">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-sm text-foreground">{mockSubjects.find((s) => s.id === item.subjectId)?.name}</span>
                    <span className="font-mono text-sm text-foreground">
                      {item.marksObtained ?? "—"} / {item.maxMarks}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between bg-muted/40 px-4 py-2.5">
                  <span className="text-sm font-medium text-foreground">Total</span>
                  <span className="font-mono text-sm font-medium text-foreground">
                    {total} / {maxTotal}
                  </span>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
