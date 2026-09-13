import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";
import { createApprovalRequest } from "../approvals/service.js";
import { createEnrollment } from "../enrollments/service.js";
import { studentScopeWhereDirect, type StudentScopeFilter } from "../../lib/scope.js";

function include() {
  return {
    student: { select: { id: true, fullName: true, studentCode: true } },
    fromEnrollment: true,
    targetClass: true,
    targetSection: true,
    newEnrollment: true,
  } as const;
}

async function assertTargetSectionUsable(sectionId: string, classId: string, academicYearId: string) {
  const section = await prisma.section.findUnique({ where: { id: sectionId } });
  if (!section || section.archivedAt) throw new HttpError(400, "SECTION_NOT_FOUND", "Target section not found or archived");
  if (section.classId !== classId) throw new HttpError(400, "SECTION_CLASS_MISMATCH", "Target section does not belong to the target class");
  if (section.academicYearId !== academicYearId) {
    throw new HttpError(400, "SECTION_YEAR_MISMATCH", "Target section does not belong to the target academic year");
  }
}

// PROMOTE/REPEAT execute immediately (a new Enrollment is created right
// away). CLASS_JUMP requires approval — the Promotion row is created
// PENDING, unexecuted, and a PROMOTION_CLASS_JUMP approval request is
// raised; decidePromotionClassJump() executes it on approval. PENDING
// (re-exam) never executes on its own.
export async function createPromotion(
  input: {
    studentId: string;
    fromEnrollmentId: string;
    academicYearId: string;
    targetClassId: string;
    targetSectionId: string;
    decision: "PROMOTE" | "REPEAT" | "PENDING" | "CLASS_JUMP";
    reason?: string;
  },
  actorId: string
) {
  const fromEnrollment = await prisma.enrollment.findUnique({ where: { id: input.fromEnrollmentId } });
  if (!fromEnrollment || fromEnrollment.studentId !== input.studentId) {
    throw new HttpError(400, "ENROLLMENT_NOT_FOUND", "Enrollment not found for this student");
  }
  if (fromEnrollment.status !== "ACTIVE") {
    throw new HttpError(409, "ENROLLMENT_NOT_ACTIVE", "Only an active enrollment can be promoted");
  }
  if (input.decision === "CLASS_JUMP" && !input.reason) {
    throw new HttpError(400, "REASON_REQUIRED", "A reason is required for a class jump");
  }

  await assertTargetSectionUsable(input.targetSectionId, input.targetClassId, input.academicYearId);

  const promotion = await prisma.promotion.create({
    data: {
      studentId: input.studentId,
      fromEnrollmentId: input.fromEnrollmentId,
      academicYearId: input.academicYearId,
      targetClassId: input.targetClassId,
      targetSectionId: input.targetSectionId,
      decision: input.decision,
      reason: input.reason,
      decidedById: actorId,
    },
    include: include(),
  });

  await writeAuditLog({ actorId, action: "CREATE", resource: "Promotion", recordId: promotion.id, newValue: input });

  if (input.decision === "PROMOTE" || input.decision === "REPEAT") {
    return executePromotion(promotion.id, actorId);
  }

  if (input.decision === "CLASS_JUMP") {
    // The source section's campus (the student's current campus, whose
    // Campus Head is making this decision) — not the target section's,
    // which could theoretically differ (cross-campus class-jump is an
    // open question, see docs/PHASE_11A_CAMPUS_SCOPING_IMPLEMENTATION_PLAN.md).
    const fromSection = await prisma.section.findUnique({ where: { id: fromEnrollment.sectionId }, select: { campusId: true } });

    await createApprovalRequest({
      type: "PROMOTION_CLASS_JUMP",
      resource: "Promotion",
      recordId: promotion.id,
      requestedById: actorId,
      approverRole: "CAMPUS_HEAD",
      payload: { promotionId: promotion.id, reason: input.reason },
      campusId: fromSection?.campusId,
    });
  }

  return promotion;
}

// Not wrapped in the same DB transaction as createEnrollment (which uses
// the shared prisma client, not a passed-in tx) — a real enrollment is the
// important side effect; if linking it back to the Promotion row fails
// afterward, the enrollment itself is still valid and this can be retried.
async function executePromotion(promotionId: string, actorId: string) {
  const promotion = await prisma.promotion.findUniqueOrThrow({ where: { id: promotionId } });

  const enrollment = await createEnrollment(
    {
      studentId: promotion.studentId,
      academicYearId: promotion.academicYearId,
      classId: promotion.targetClassId,
      sectionId: promotion.targetSectionId,
    },
    actorId
  );

  const updated = await prisma.promotion.update({
    where: { id: promotionId },
    data: { newEnrollmentId: enrollment.id, executedAt: new Date() },
    include: include(),
  });

  await writeAuditLog({
    actorId,
    action: "EXECUTE",
    resource: "Promotion",
    recordId: promotionId,
    newValue: { newEnrollmentId: enrollment.id },
  });

  return updated;
}

export async function listPromotions(filter: StudentScopeFilter & { academicYearId?: string }) {
  return prisma.promotion.findMany({
    where: { ...studentScopeWhereDirect(filter), academicYearId: filter.academicYearId },
    include: include(),
    orderBy: { createdAt: "desc" },
  });
}

export async function decidePromotionClassJump(
  approvalRequestId: string,
  decision: "APPROVED" | "REJECTED",
  decisionNote: string | undefined,
  actorId: string
) {
  const request = await prisma.approvalRequest.findUnique({ where: { id: approvalRequestId } });
  if (!request || request.type !== "PROMOTION_CLASS_JUMP") {
    throw new HttpError(404, "CLASS_JUMP_NOT_FOUND", "Class jump request not found");
  }
  if (request.status !== "PENDING") {
    throw new HttpError(409, "APPROVAL_ALREADY_DECIDED", `Request already ${request.status.toLowerCase()}`);
  }

  const payload = request.payload as { promotionId: string; reason: string };

  const updatedRequest = await prisma.approvalRequest.update({
    where: { id: approvalRequestId },
    data: { status: decision, decidedById: actorId, decidedAt: new Date(), decisionNote },
  });

  if (decision === "APPROVED") {
    await executePromotion(payload.promotionId, actorId);
  }

  await writeAuditLog({
    actorId,
    action: decision === "APPROVED" ? "APPROVE" : "REJECT",
    resource: "Promotion",
    recordId: payload.promotionId,
    reason: payload.reason,
    approvedBy: decision === "APPROVED" ? actorId : undefined,
  });

  return updatedRequest;
}
