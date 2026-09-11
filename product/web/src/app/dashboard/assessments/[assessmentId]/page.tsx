import { apiRequest } from "@/lib/apiClient";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MarksRow } from "./marks-row";
import { SubmitAssessmentButton } from "./submit-button";
import { RequestMarksCorrectionDialog } from "./correction-dialog";
import { DecideMarksCorrectionButtons } from "./decide-correction-buttons";

interface AssessmentResult {
  id: string;
  studentId: string;
  marksObtained: number;
  remarks: string | null;
  student: { id: string; fullName: string; studentCode: string };
}

interface Assessment {
  id: string;
  title: string;
  totalMarks: number;
  assessmentDate: string;
  status: "DRAFT" | "SUBMITTED";
  sectionId: string;
  subject: { name: string };
  section: { name: string };
  teacher: { user: { fullName: string } };
  results: AssessmentResult[];
}

interface Enrollment {
  status: "ACTIVE" | "TRANSFERRED" | "WITHDRAWN";
  student: { id: string; fullName: string; studentCode: string };
}

interface ApprovalRequest {
  id: string;
  type: string;
  status: string;
  payload: { assessmentResultId: string; oldMarks: number; newMarks: number; reason: string };
  requestedBy: { fullName: string };
}

export default async function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;

  const assessment = await apiRequest<Assessment>(`/api/v1/assessments/${assessmentId}`);
  const [enrollments, pendingApprovals] = await Promise.all([
    apiRequest<Enrollment[]>(`/api/v1/enrollments?sectionId=${assessment.sectionId}`),
    apiRequest<ApprovalRequest[]>("/api/v1/approvals?status=PENDING"),
  ]);

  const activeStudents = enrollments.filter((e) => e.status === "ACTIVE").map((e) => e.student);
  const resultByStudentId = new Map(assessment.results.map((r) => [r.studentId, r]));
  const resultIds = new Set(assessment.results.map((r) => r.id));
  const corrections = pendingApprovals.filter(
    (a) => a.type === "ASSESSMENT_MARKS_CORRECTION" && resultIds.has(a.payload.assessmentResultId)
  );

  return (
    <div>
      <PageHeader
        title={assessment.title}
        description={`${assessment.subject.name} · ${assessment.section.name} · Total marks: ${assessment.totalMarks}`}
        action={
          assessment.status === "DRAFT" ? (
            <SubmitAssessmentButton assessmentId={assessment.id} />
          ) : (
            <Badge variant="secondary">Locked</Badge>
          )
        }
      />

      {activeStudents.length === 0 ? (
        <p className="text-sm text-muted-foreground">No actively enrolled students in this section.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Marks</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeStudents.map((student) => {
                const result = resultByStudentId.get(student.id);
                return (
                  <TableRow key={student.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{student.studentCode}</TableCell>
                    <TableCell className="font-medium">{student.fullName}</TableCell>
                    <TableCell>
                      {assessment.status === "DRAFT" ? (
                        <MarksRow
                          assessmentId={assessment.id}
                          studentId={student.id}
                          totalMarks={assessment.totalMarks}
                          initialMarks={result?.marksObtained ?? null}
                          initialRemarks={result?.remarks ?? null}
                        />
                      ) : result ? (
                        `${result.marksObtained} / ${assessment.totalMarks}`
                      ) : (
                        <span className="text-xs text-muted-foreground">Not entered</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {assessment.status === "SUBMITTED" && result ? (
                        <RequestMarksCorrectionDialog
                          assessmentId={assessment.id}
                          resultId={result.id}
                          currentMarks={result.marksObtained}
                          totalMarks={assessment.totalMarks}
                        />
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {corrections.length > 0 ? (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Pending marks corrections</h2>
          <div className="flex flex-col gap-3">
            {corrections.map((approval) => (
              <div key={approval.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="text-sm">
                  <p className="text-foreground">
                    {approval.payload.oldMarks} → {approval.payload.newMarks}
                  </p>
                  <p className="text-muted-foreground">
                    Requested by {approval.requestedBy.fullName}: &ldquo;{approval.payload.reason}&rdquo;
                  </p>
                </div>
                <DecideMarksCorrectionButtons assessmentId={assessment.id} approvalId={approval.id} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
