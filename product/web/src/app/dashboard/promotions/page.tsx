import { apiRequest } from "@/lib/apiClient";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PromotionFilters } from "./filters";
import { DecidePromotionDialog } from "./decide-dialog";
import { DecideClassJumpButtons } from "./decide-class-jump-buttons";

interface NamedOption {
  id: string;
  name: string;
}

interface RawSection {
  id: string;
  name: string;
  classId: string;
  campusId: string;
  academicYearId: string;
  archivedAt: string | null;
}

interface Enrollment {
  id: string;
  status: "ACTIVE" | "TRANSFERRED" | "WITHDRAWN";
  student: { id: string; fullName: string; studentCode: string };
}

interface Promotion {
  id: string;
  decision: string;
  executedAt: string | null;
  student: { id: string };
}

interface ApprovalRequest {
  id: string;
  type: string;
  payload: { promotionId: string; reason: string };
  requestedBy: { fullName: string };
}

export default async function PromotionsPage({
  searchParams,
}: {
  searchParams: Promise<{ fromSectionId?: string; targetYearId?: string; targetClassId?: string; targetSectionId?: string }>;
}) {
  const params = await searchParams;

  // Mirrors promotion.create/promotion.approve from routes.ts. The pending
  // class-jump approvals panel (and its /api/v1/approvals fetch, which
  // requires the distinct approval.view permission) exists only to let a
  // promotion.approve holder decide it, so it's gated behind canApprove —
  // a promotion.view-only user would otherwise 403 on that fetch before
  // ever seeing the promotions list below it.
  const currentUser = await getCurrentUser();
  const permissions = currentUser?.permissions ?? [];
  const canCreate = permissions.includes("promotion.create");
  const canApprove = permissions.includes("promotion.approve");

  const [rawSections, classes, campuses, academicYears, pendingApprovals] = await Promise.all([
    apiRequest<RawSection[]>("/api/v1/sections"),
    apiRequest<NamedOption[]>("/api/v1/classes"),
    apiRequest<NamedOption[]>("/api/v1/campuses"),
    apiRequest<NamedOption[]>("/api/v1/academic-years"),
    canApprove ? apiRequest<ApprovalRequest[]>("/api/v1/approvals?status=PENDING") : Promise.resolve<ApprovalRequest[]>([]),
  ]);

  const classJumpApprovals = pendingApprovals.filter((a) => a.type === "PROMOTION_CLASS_JUMP");

  const classNameById = new Map(classes.map((c) => [c.id, c.name]));
  const campusNameById = new Map(campuses.map((c) => [c.id, c.name]));
  const yearNameById = new Map(academicYears.map((y) => [y.id, y.name]));

  const activeSections = rawSections.filter((s) => !s.archivedAt);

  if (activeSections.length === 0 || academicYears.length === 0) {
    return (
      <div>
        <PageHeader title="Promotions" description="Decide each student's promotion into next year's class/section." />
        <p className="text-sm text-muted-foreground">Create sections and academic years first.</p>
      </div>
    );
  }

  const fromSectionOptions = activeSections.map((s) => ({
    id: s.id,
    label: `${classNameById.get(s.classId) ?? "—"} ${s.name} · ${campusNameById.get(s.campusId) ?? "—"} · ${yearNameById.get(s.academicYearId) ?? "—"}`,
  }));
  const targetYearOptions = academicYears.map((y) => ({ id: y.id, label: y.name }));
  const targetClassOptions = classes.map((c) => ({ id: c.id, label: c.name }));

  const fromSectionId = params.fromSectionId ?? fromSectionOptions[0]!.id;
  const targetYearId = params.targetYearId ?? targetYearOptions[0]!.id;
  const targetClassId = params.targetClassId ?? targetClassOptions[0]!.id;

  const targetSectionOptions = activeSections
    .filter((s) => s.academicYearId === targetYearId && s.classId === targetClassId)
    .map((s) => ({ id: s.id, label: `${s.name} · ${campusNameById.get(s.campusId) ?? "—"}` }));

  const targetSectionId = params.targetSectionId ?? targetSectionOptions[0]?.id ?? "";
  const canDecide = Boolean(targetYearId && targetClassId && targetSectionId);

  const [enrollments, existingPromotions] = await Promise.all([
    apiRequest<Enrollment[]>(`/api/v1/enrollments?sectionId=${fromSectionId}`),
    apiRequest<Promotion[]>(`/api/v1/promotions?academicYearId=${targetYearId}`),
  ]);

  const activeStudents = enrollments.filter((e) => e.status === "ACTIVE").map((e) => e.student);
  const decidedStudentIds = new Set(existingPromotions.map((p) => p.student.id));

  return (
    <div>
      <PageHeader title="Promotions" description="Decide each student's promotion into next year's class/section." />

      <PromotionFilters
        fromSections={fromSectionOptions}
        targetYears={targetYearOptions}
        targetClasses={targetClassOptions}
        targetSections={targetSectionOptions}
        selected={{ fromSectionId, targetYearId, targetClassId, targetSectionId }}
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
                <TableHead>Status</TableHead>
                {canCreate ? <TableHead className="text-right">Actions</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeStudents.map((student) => {
                const decided = decidedStudentIds.has(student.id);
                return (
                  <TableRow key={student.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{student.studentCode}</TableCell>
                    <TableCell className="font-medium">{student.fullName}</TableCell>
                    <TableCell>{decided ? <Badge variant="secondary">Decided</Badge> : <Badge variant="secondary">Pending</Badge>}</TableCell>
                    {canCreate ? (
                      <TableCell className="text-right">
                        {!decided ? (
                          <DecidePromotionDialog
                            studentName={student.fullName}
                            studentId={student.id}
                            fromEnrollmentId={
                              enrollments.find((e) => e.student.id === student.id)!.id
                            }
                            academicYearId={targetYearId}
                            targetClassId={targetClassId}
                            targetSectionId={targetSectionId}
                            disabled={!canDecide}
                          />
                        ) : null}
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {classJumpApprovals.length > 0 ? (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Pending class jump approvals</h2>
          <div className="flex flex-col gap-3">
            {classJumpApprovals.map((approval) => (
              <div key={approval.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="text-sm">
                  <p className="text-foreground">Class jump requested</p>
                  <p className="text-muted-foreground">
                    Requested by {approval.requestedBy.fullName}: &ldquo;{approval.payload.reason}&rdquo;
                  </p>
                </div>
                <DecideClassJumpButtons approvalId={approval.id} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
