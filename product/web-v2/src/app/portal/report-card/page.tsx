"use client";

import { PageHeader } from "@/components/page-header";
import { getStudentById } from "@/lib/mock/students";
import { mockExams } from "@/lib/mock/exams";
import { mockSubjects } from "@/lib/mock/subjects";
import { mockReportCards } from "@/lib/mock/report-cards";
import { usePortal } from "../portal-context";

export default function PortalReportCardPage() {
  const { activeChildId } = usePortal();
  const student = getStudentById(activeChildId);
  const cards = mockReportCards.filter((rc) => rc.studentId === activeChildId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Report Card" description={`${student?.fullName}'s generated report cards.`} />
      {cards.length === 0 ? (
        <p className="text-sm text-muted-foreground">No report card generated yet.</p>
      ) : (
        cards.map((card) => (
          <div key={card.id} className="flex flex-col gap-2">
            <span className="label-eyebrow text-muted-foreground">{mockExams.find((e) => e.id === card.examId)?.name}</span>
            <div className="surface-ring flex flex-col divide-y divide-border overflow-hidden rounded-[var(--card-radius)]">
              {card.snapshot.map((item) => (
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
                  {card.totalObtained} / {card.totalMax}
                </span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
