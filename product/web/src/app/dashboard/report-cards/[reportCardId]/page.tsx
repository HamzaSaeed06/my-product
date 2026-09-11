import { apiRequest } from "@/lib/apiClient";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Snapshot {
  studentName: string;
  studentCode: string;
  examName: string;
  generatedAt: string;
  items: { subject: string; marksObtained: number; totalMarks: number; grade: string | null; remarks: string | null }[];
}

interface ReportCard {
  id: string;
  snapshot: Snapshot;
  generatedAt: string;
}

export default async function ReportCardDetailPage({
  params,
}: {
  params: Promise<{ reportCardId: string }>;
}) {
  const { reportCardId } = await params;
  const reportCard = await apiRequest<ReportCard>(`/api/v1/report-cards/${reportCardId}`);
  const { snapshot } = reportCard;

  const totalObtained = snapshot.items.reduce((sum, item) => sum + item.marksObtained, 0);
  const totalMax = snapshot.items.reduce((sum, item) => sum + item.totalMarks, 0);

  return (
    <div>
      <PageHeader
        title={`${snapshot.studentName} — ${snapshot.examName}`}
        description={`${snapshot.studentCode} · Generated ${new Date(snapshot.generatedAt).toLocaleString()}`}
      />

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Marks</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Remarks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {snapshot.items.map((item, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{item.subject}</TableCell>
                <TableCell className="text-muted-foreground">
                  {item.marksObtained}/{item.totalMarks}
                </TableCell>
                <TableCell className="text-muted-foreground">{item.grade ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{item.remarks ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="mt-4 text-sm font-medium text-foreground">
        Total: {totalObtained}/{totalMax}
      </p>

      <p className="mt-2 text-xs text-muted-foreground">
        This is a data snapshot, not a formatted PDF — printable/exportable rendering is planned once a PDF-generation
        library is chosen.
      </p>
    </div>
  );
}
