import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";
import { getActorProfile, resolveStudentScopeFilter, assertStudentInScope } from "../../lib/scope.js";
import { getPaymentStudentId } from "../payments/service.js";

const amountSchema = z.string().regex(/^\d+(\.\d{1,2})?$/, "amount must be a decimal number with up to 2 places");

const listQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "COMPLETED"]).optional(),
  studentId: z.string().uuid().optional(),
});
const createSchema = z.object({ paymentId: z.string().uuid(), amount: amountSchema, reason: z.string().min(1), method: z.string().optional() });
const decideSchema = z.object({ decision: z.enum(["APPROVED", "REJECTED"]) });

export async function listRefundsHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  const profile = await getActorProfile(req.user!.id);
  const studentScope = await resolveStudentScopeFilter(profile, query.studentId);
  res.status(200).json(await service.listRefunds({ status: query.status, ...studentScope }));
}

export async function createRefundHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  const profile = await getActorProfile(req.user!.id);
  await assertStudentInScope(profile, await getPaymentStudentId(body.paymentId));
  res.status(201).json(await service.createRefund(body, req.user!.id));
}

export async function decideRefundHandler(req: Request, res: Response): Promise<void> {
  const body = decideSchema.parse(req.body);
  const profile = await getActorProfile(req.user!.id);
  await assertStudentInScope(profile, await service.getRefundStudentId(req.params.refundId!));
  res.status(200).json(await service.decideRefund(req.params.refundId!, body.decision, req.user!.id));
}

export async function completeRefundHandler(req: Request, res: Response): Promise<void> {
  const profile = await getActorProfile(req.user!.id);
  await assertStudentInScope(profile, await service.getRefundStudentId(req.params.refundId!));
  res.status(200).json(await service.completeRefund(req.params.refundId!, req.user!.id));
}
