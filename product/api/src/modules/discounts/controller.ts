import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";
import { getActorProfile, resolveStudentScopeFilter, assertStudentInScope } from "../../lib/scope.js";

const amountSchema = z.string().regex(/^\d+(\.\d{1,2})?$/, "amount must be a decimal number with up to 2 places");
const TYPES = ["SIBLING", "MERIT", "STAFF", "OTHER"] as const;

const listQuerySchema = z.object({
  studentId: z.string().uuid().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
});

const createSchema = z.object({
  studentId: z.string().uuid(),
  feeStructureId: z.string().uuid().optional(),
  type: z.enum(TYPES),
  amount: amountSchema.optional(),
  percentage: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  reason: z.string().min(1),
});

const decideSchema = z.object({ decision: z.enum(["APPROVED", "REJECTED"]) });

export async function listDiscountsHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  const profile = await getActorProfile(req.user!.id);
  const studentScope = await resolveStudentScopeFilter(profile, query.studentId);
  res.status(200).json(await service.listDiscounts({ status: query.status, ...studentScope }));
}

export async function createDiscountHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  const profile = await getActorProfile(req.user!.id);
  await assertStudentInScope(profile, body.studentId);
  res.status(201).json(await service.createDiscount(body, req.user!.id));
}

export async function decideDiscountHandler(req: Request, res: Response): Promise<void> {
  const body = decideSchema.parse(req.body);
  const profile = await getActorProfile(req.user!.id);
  await assertStudentInScope(profile, await service.getDiscountStudentId(req.params.discountId!));
  res.status(200).json(await service.decideDiscount(req.params.discountId!, body.decision, req.user!.id));
}
