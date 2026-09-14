"use client";

import { PageHeader } from "@/components/page-header";
import { StatStrip } from "@/components/stat-tile";
import { ExportButton } from "@/components/export-button";
import { mockAdmissions, type AdmissionStatus } from "@/lib/mock/admissions";
import { mockClasses } from "@/lib/mock/classes";

const STATUS_LABEL: Record<AdmissionStatus, string> = { PENDING: "Pending", APPROVED: "Approved", REJECTED: "Rejected", WITHDRAWN: "Withdrawn" };

export default function AdmissionsReportPage() {
  const total = mockAdmissions.length;
  const pending = mockAdmissions.filter((a) => a.status === "PENDING").length;
  const approved = mockAdmissions.filter((a) => a.status === "APPROVED").length;
  const closedOut = mockAdmissions.filter((a) => a.status === "REJECTED" || a.status === "WITHDRAWN").length;

  const byClass = Array.from(new Set(mockAdmissions.map((a) => a.classId))).map((classId) => ({
    classId,
    count: mockAdmissions.filter((a) => a.classId === classId).length,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Admissions Report"
        description="Applications by status and class — computed live from Admissions."
        actions={<ExportButton filename="admissions-report.csv" rows={[["Class", "Applications"], ...byClass.map((c) => [mockClasses.find((cl) => cl.id === c.classId)?.name ?? c.classId, c.count])]} />}
      />
      <StatStrip
        entries={[
          { label: "Total applications", value: total },
          { label: "Pending", value: pending },
          { label: "Approved", value: approved },
          { label: "Rejected/Withdrawn", value: closedOut },
        ]}
      />
      <div className="surface-ring overflow-hidden rounded-[var(--card-radius)]">
        <div className="divide-y divide-border">
          {mockAdmissions.map((a) => (
            <div key={a.id} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm text-foreground">{mockClasses.find((c) => c.id === a.classId)?.name}</span>
              <span className="text-sm text-muted-foreground">{STATUS_LABEL[a.status]} · {a.appliedAt}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
