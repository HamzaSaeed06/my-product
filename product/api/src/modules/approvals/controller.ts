import type { Request, Response } from "express";
import { z } from "zod";
import * as approvalsService from "./service.js";
import { getActorProfile, assertCampusInScope } from "../../lib/scope.js";
import { HttpError } from "../../middleware/errorHandler.js";

const listQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
});

const decideSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  decisionNote: z.string().max(1000).optional(),
});

export async function listApprovalsHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  const profile = await getActorProfile(req.user!.id);
  const campusIdIn = profile.campusIds.length > 0 ? profile.campusIds : undefined;
  res.status(200).json(await approvalsService.listApprovalRequests({ status: query.status, campusIdIn }));
}

export async function decideApprovalHandler(req: Request, res: Response): Promise<void> {
  const body = decideSchema.parse(req.body);
  const profile = await getActorProfile(req.user!.id);
  // Only enforced for a campus-assigned actor (CAMPUS_HEAD/OFFICE) — same
  // pattern as complaints/leaves: INCHARGE also decides some correction
  // types via a different, not-campus-based scope.
  if (profile.campusIds.length > 0) {
    const campusId = await approvalsService.getApprovalRequestCampusId(req.params.approvalId!);
    if (!campusId) throw new HttpError(403, "OUT_OF_SCOPE", "Cannot verify this request's campus");
    assertCampusInScope(profile, campusId);
  }
  const updated = await approvalsService.decideApprovalRequest(
    req.params.approvalId!,
    body.decision,
    body.decisionNote,
    req.user!.id
  );
  res.status(200).json(updated);
}
