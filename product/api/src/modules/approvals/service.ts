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
}) {
  const request = await prisma.approvalRequest.create({
    data: {
      type: input.type,
      resource: input.resource,
      recordId: input.recordId,
      requestedById: input.requestedById,
      approverRole: input.approverRole,
      payload: input.payload,
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

export async function listApprovalRequests(filter: { status?: ApprovalStatus }) {
  return prisma.approvalRequest.findMany({
    where: filter.status ? { status: filter.status } : undefined,
    include: { requestedBy: { select: { id: true, fullName: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
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
