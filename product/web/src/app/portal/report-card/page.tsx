import { getCurrentUser } from "@/lib/session";
import { apiRequest } from "@/lib/apiClient";

interface ReportCardSnapshot {
  studentName: string;
  studentCode: string;
  examName: string;
  items: { subject: string; marksObtained: number; totalMarks: number; grade: string | null; remarks: string | null }[];
}

interface ReportCard {
  id: string;
  generatedAt: string;
  result: {
    exam: { name: string };
  };
  snapshot: ReportCardSnapshot;
}

export default async function PortalReportCardPage() {
  const user = await getCurrentUser();
  if (!user?.studentId) return null;

  const reportCards = await apiRequest<ReportCard[]>(`/api/v1/report-cards?studentId=${user.studentId}`);

  return (
    <div>
      <h1 className="text-lg font-semibold text-foreground">Report Card</h1>
      {reportCards.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No report cards generated yet.</p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {reportCards.map((rc) => (
            <div key={rc.id} className="rounded-lg border border-border p-4">
              <p className="text-sm font-medium text-foreground">{rc.result.exam.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Generated {new Date(rc.generatedAt).toLocaleDateString()}
              </p>
              <div className="mt-3 flex flex-col gap-2">
                {rc.snapshot.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md bg-secondary/40 px-3 py-2 text-sm">
                    <span className="text-foreground">{item.subject}</span>
                    <span className="text-muted-foreground">
                      {item.marksObtained}/{item.totalMarks} {item.grade ? `(${item.grade})` : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
