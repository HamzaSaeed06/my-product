import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";
import { createApprovalRequest } from "../approvals/service.js";

function include() {
  return {
    student: { select: { id: true, fullName: true, studentCode: true } },
    exam: true,
    section: true,
    items: { include: { subject: true } },
  } as const;
}

// Idempotent bulk creation: one DRAFT Result per actively-enrolled student
// in the section, for this exam — mirrors Attendance's "mark for a whole
// section at once" shape, but results are seeded empty (no ResultItems)
// rather than requiring a status choice up front.
export async function getOrCreateResultsForSection(examId: string, sectionId: string) {
  const [exam, section] = await Promise.all([
    prisma.exam.findUnique({ where: { id: examId } }),
    prisma.section.findUnique({ where: { id: sectionId } }),
  ]);
  if (!exam) throw new HttpError(400, "EXAM_NOT_FOUND", "Exam not found");
  if (!section || section.archivedAt) throw new HttpError(400, "SECTION_NOT_FOUND", "Section not found or archived");
  if (section.academicYearId !== exam.academicYearId) {
    throw new HttpError(400, "SECTION_YEAR_MISMATCH", "This section does not belong to the exam's academic year");
  }

  const enrollments = await prisma.enrollment.findMany({ where: { sectionId, status: "ACTIVE" } });

  const existing = await prisma.result.findMany({ where: { examId, studentId: { in: enrollments.map((e) => e.studentId) } } });
  const existingStudentIds = new Set(existing.map((r) => r.studentId));

  const toCreate = enrollments.filter((e) => !existingStudentIds.has(e.studentId));
  if (toCreate.length > 0) {
    await prisma.result.createMany({
      data: toCreate.map((e) => ({ studentId: e.studentId, examId, sectionId })),
    });
  }

  return prisma.result.findMany({ where: { examId, studentId: { in: enrollments.map((e) => e.studentId) } }, include: include() });
}

// Read-only, unlike getOrCreateResultsForSection — used by the Parent/
// Student Portal "Results" screens, which must never trigger DRAFT Result
// creation as a side effect of merely looking. Only PUBLISHED results are
// returned: a student's own Result row exists in DRAFT the moment a
// teacher starts entering marks, long before it's meant to be seen.
export async function listResultsForStudent(studentId: string) {
  return prisma.result.findMany({
    where: { studentId, status: "PUBLISHED" },
    include: include(),
    orderBy: { publishedAt: "desc" },
  });
}

export async function getResult(id: string) {
  const result = await prisma.result.findUnique({ where: { id }, include: include() });
  if (!result) throw new HttpError(404, "RESULT_NOT_FOUND", "Result not found");
  return result;
}

// Editing an item is only allowed while the parent Result is DRAFT — once
// submitted, use the workflow transitions; once finalized/published, use
// requestResultCorrection instead of a direct edit.
export async function enterResultItem(
  resultId: string,
  input: { subjectId: string; marksObtained: number; totalMarks: number; grade?: string; remarks?: string },
  actorId: string
) {
  const result = await prisma.result.findUnique({ where: { id: resultId } });
  if (!result) throw new HttpError(404, "RESULT_NOT_FOUND", "Result not found");
  if (result.status !== "DRAFT") {
    throw new HttpError(409, "RESULT_NOT_DRAFT", "Result items can only be entered while the result is in draft");
  }
  if (input.marksObtained < 0 || input.marksObtained > input.totalMarks) {
    throw new HttpError(400, "MARKS_OUT_OF_RANGE", "marksObtained must be between 0 and totalMarks");
  }

  const item = await prisma.resultItem.upsert({
    where: { resultId_subjectId: { resultId, subjectId: input.subjectId } },
    create: { resultId, ...input },
    update: input,
  });

  await writeAuditLog({ actorId, action: "UPSERT", resource: "ResultItem", recordId: item.id, newValue: input });

  return item;
}

function assertTransition(current: string, expected: string) {
  if (current !== expected) {
    throw new HttpError(
      409,
      "INVALID_STATE_TRANSITION",
      `Result must be ${expected} for this action — it is currently ${current}`
    );
  }
}

export async function submitResult(id: string, actorId: string) {
  const result = await prisma.result.findUnique({ where: { id } });
  if (!result) throw new HttpError(404, "RESULT_NOT_FOUND", "Result not found");
  assertTransition(result.status, "DRAFT");

  const updated = await prisma.result.update({ where: { id }, data: { status: "SUBMITTED", submittedAt: new Date() }, include: include() });

  await writeAuditLog({ actorId, action: "SUBMIT", resource: "Result", recordId: id, newValue: { status: "SUBMITTED" } });

  return updated;
}

export async function reviewResult(id: string, actorId: string) {
  const result = await prisma.result.findUnique({ where: { id } });
  if (!result) throw new HttpError(404, "RESULT_NOT_FOUND", "Result not found");
  assertTransition(result.status, "SUBMITTED");

  const updated = await prisma.result.update({
    where: { id },
    data: { status: "REVIEWED", reviewedById: actorId, reviewedAt: new Date() },
    include: include(),
  });

  await writeAuditLog({ actorId, action: "REVIEW", resource: "Result", recordId: id, newValue: { status: "REVIEWED" } });

  return updated;
}

export async function finalizeResult(id: string, actorId: string) {
  const result = await prisma.result.findUnique({ where: { id } });
  if (!result) throw new HttpError(404, "RESULT_NOT_FOUND", "Result not found");
  assertTransition(result.status, "REVIEWED");

  const updated = await prisma.result.update({
    where: { id },
    data: { status: "FINALIZED", finalizedById: actorId, finalizedAt: new Date() },
    include: include(),
  });

  await writeAuditLog({ actorId, action: "FINALIZE", resource: "Result", recordId: id, newValue: { status: "FINALIZED" } });

  return updated;
}

export async function publishResult(id: string, actorId: string) {
  const result = await prisma.result.findUnique({ where: { id } });
  if (!result) throw new HttpError(404, "RESULT_NOT_FOUND", "Result not found");
  assertTransition(result.status, "FINALIZED");

  const updated = await prisma.result.update({
    where: { id },
    data: { status: "PUBLISHED", publishedById: actorId, publishedAt: new Date() },
    include: include(),
  });

  await writeAuditLog({ actorId, action: "PUBLISH", resource: "Result", recordId: id, newValue: { status: "PUBLISHED" } });

  return updated;
}

export async function requestResultCorrection(
  resultItemId: string,
  input: { newMarks: number; reason: string },
  actorId: string
) {
  const item = await prisma.resultItem.findUnique({ where: { id: resultItemId }, include: { result: true } });
  if (!item) throw new HttpError(404, "RESULT_ITEM_NOT_FOUND", "Result item not found");
  if (item.result.status !== "FINALIZED" && item.result.status !== "PUBLISHED") {
    throw new HttpError(400, "NOT_LOCKED", "Only marks on a finalized/published result need a correction request — edit directly instead");
  }
  if (input.newMarks < 0 || input.newMarks > item.totalMarks) {
    throw new HttpError(400, "MARKS_OUT_OF_RANGE", `newMarks must be between 0 and ${item.totalMarks}`);
  }
  if (input.newMarks === item.marksObtained) {
    throw new HttpError(400, "NO_CHANGE", "Requested marks are the same as the current marks");
  }

  return createApprovalRequest({
    type: "RESULT_CORRECTION",
    resource: "ResultItem",
    recordId: resultItemId,
    requestedById: actorId,
    approverRole: "PRINCIPAL",
    payload: { resultItemId, oldMarks: item.marksObtained, newMarks: input.newMarks, reason: input.reason },
  });
}

// Applies the effect directly here, not in the generic approvals module —
// same reasoning as Phase 3's attendance/assessment correction deciders.
export async function decideResultCorrection(
  approvalRequestId: string,
  decision: "APPROVED" | "REJECTED",
  decisionNote: string | undefined,
  actorId: string
) {
  const request = await prisma.approvalRequest.findUnique({ where: { id: approvalRequestId } });
  if (!request || request.type !== "RESULT_CORRECTION") {
    throw new HttpError(404, "CORRECTION_NOT_FOUND", "Result correction request not found");
  }
  if (request.status !== "PENDING") {
    throw new HttpError(409, "APPROVAL_ALREADY_DECIDED", `Request already ${request.status.toLowerCase()}`);
  }

  const payload = request.payload as { resultItemId: string; oldMarks: number; newMarks: number; reason: string };

  const updatedRequest = await prisma.$transaction(async (tx) => {
    const req = await tx.approvalRequest.update({
      where: { id: approvalRequestId },
      data: { status: decision, decidedById: actorId, decidedAt: new Date(), decisionNote },
    });
    if (decision === "APPROVED") {
      await tx.resultItem.update({ where: { id: payload.resultItemId }, data: { marksObtained: payload.newMarks } });
    }
    return req;
  });

  await writeAuditLog({
    actorId,
    action: decision === "APPROVED" ? "APPROVE" : "REJECT",
    resource: "ResultItem",
    recordId: payload.resultItemId,
    oldValue: { marksObtained: payload.oldMarks },
    newValue: decision === "APPROVED" ? { marksObtained: payload.newMarks } : undefined,
    reason: payload.reason,
    approvedBy: decision === "APPROVED" ? actorId : undefined,
  });

  return updatedRequest;
}
