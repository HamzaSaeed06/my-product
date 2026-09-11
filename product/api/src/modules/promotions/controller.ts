import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";

const DECISIONS = ["PROMOTE", "REPEAT", "PENDING", "CLASS_JUMP"] as const;

const listQuerySchema = z.object({
  studentId: z.string().uuid().optional(),
  academicYearId: z.string().uuid().optional(),
});

const createSchema = z.object({
  studentId: z.string().uuid(),
  fromEnrollmentId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  targetClassId: z.string().uuid(),
  targetSectionId: z.string().uuid(),
  decision: z.enum(DECISIONS),
  reason: z.string().optional(),
});

const decideSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  decisionNote: z.string().optional(),
});

export async function listPromotionsHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  res.status(200).json(await service.listPromotions(query));
}

export async function createPromotionHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  res.status(201).json(await service.createPromotion(body, req.user!.id));
}

export async function decidePromotionClassJumpHandler(req: Request, res: Response): Promise<void> {
  const body = decideSchema.parse(req.body);
  const result = await service.decidePromotionClassJump(req.params.approvalId!, body.decision, body.decisionNote, req.user!.id);
  res.status(200).json(result);
}
