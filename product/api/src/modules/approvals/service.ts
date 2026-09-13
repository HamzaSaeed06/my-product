import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";
import type { ApprovalStatus, Prisma } from "@prisma/client";

// This is the generic approval workflow engine Phase 0 owns. Later phases
// (result corrections, fee waivers, Incharge scope changes, ...) call
// createApprovalRequest() from their own service code rather than exposing
// their own bespoke approval tables — one workflow engine, many callers.
export async function createApprovalRequest(input: {
  type: string;
  resource: string;
  recordId?: string;
  requestedById: string;
  approverRole?: string;
  payload?: Prisma.InputJsonValue;
  // Which campus this request concerns — every current caller (payment
  // reversal, attendance/assessment/result correction, class-jump
  // promotion) can derive this from the section/student/payment it's
  // about. Nullable only because a future caller might genuinely have no
  // campus-scoped subject; not populating it means a campus-assigned
  // actor can never decide that request (fails closed, not open). See
  // docs/PHASE_11A_CAMPUS_SCOPING_IMPLEMENTATION_PLAN.md Group 6.
  campusId?: string;
}) {
  const request = await prisma.approvalRequest.create({
    data: {
      type: input.type,
      resource: input.resource,
      recordId: input.recordId,
      requestedById: input.requestedById,
      approverRole: input.approverRole,
      payload: input.payload,
      campusId: input.campusId,
    },
  });

  await writeAuditLog({
    actorId: input.requestedById,
    action: "REQUEST_APPROVAL",
    resource: "ApprovalRequest",
    recordId: request.id,
    newValue: { type: input.type, resource: input.resource, recordId: input.recordId },
  });

  return request;
}

export async function listApprovalRequests(filter: { status?: ApprovalStatus; campusIdIn?: string[] }) {
  return prisma.approvalRequest.findMany({
    where: {
      status: filter.status,
      campusId: filter.campusIdIn ? { in: filter.campusIdIn } : undefined,
    },
    include: { requestedBy: { select: { id: true, fullName: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
}

// Thin getter for controllers that need to scope-check an approval
// request by id before deciding it.
export async function getApprovalRequestCampusId(id: string): Promise<string | null> {
  const request = await prisma.approvalRequest.findUnique({ where: { id }, select: { campusId: true } });
  if (!request) throw new HttpError(404, "APPROVAL_NOT_FOUND", "Approval request not found");
  return request.campusId;
}

export async function decideApprovalRequest(
  id: string,
  decision: "APPROVED" | "REJECTED",
  decisionNote: string | undefined,
  actorId: string
) {
  const request = await prisma.approvalRequest.findUnique({ where: { id } });
  if (!request) throw new HttpError(404, "APPROVAL_NOT_FOUND", "Approval request not found");
  if (request.status !== "PENDING") {
    throw new HttpError(409, "APPROVAL_ALREADY_DECIDED", `Request already ${request.status.toLowerCase()}`);
  }

  const updated = await prisma.approvalRequest.update({
    where: { id },
    data: { status: decision, decidedById: actorId, decidedAt: new Date(), decisionNote },
  });

  await writeAuditLog({
    actorId,
    action: decision === "APPROVED" ? "APPROVE" : "REJECT",
    resource: "ApprovalRequest",
    recordId: id,
    oldValue: { status: "PENDING" },
    newValue: { status: decision, decisionNote },
    approvedBy: decision === "APPROVED" ? actorId : undefined,
  });

  return updated;
}
