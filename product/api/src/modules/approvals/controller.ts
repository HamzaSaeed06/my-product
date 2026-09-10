import type { Request, Response } from "express";
import { z } from "zod";
import * as approvalsService from "./service.js";

const listQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
});

const decideSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  decisionNote: z.string().max(1000).optional(),
});

export async function listApprovalsHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  res.status(200).json(await approvalsService.listApprovalRequests({ status: query.status }));
}

export async function decideApprovalHandler(req: Request, res: Response): Promise<void> {
  const body = decideSchema.parse(req.body);
  const updated = await approvalsService.decideApprovalRequest(
    req.params.approvalId!,
    body.decision,
    body.decisionNote,
    req.user!.id
  );
  res.status(200).json(updated);
}
