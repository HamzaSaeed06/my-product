import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";
import { getActorProfile, resolveStudentScopeFilter, assertStudentInScope } from "../../lib/scope.js";

const listQuerySchema = z.object({ studentId: z.string().uuid().optional() });

const amountSchema = z.string().regex(/^\d+(\.\d{1,2})?$/, "amount must be a decimal number with up to 2 places");

const assignSchema = z.object({
  studentId: z.string().uuid(),
  feeStructureId: z.string().uuid(),
  overrideAmount: amountSchema.optional(),
});

export async function listStudentFeesHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  const profile = await getActorProfile(req.user!.id);
  const studentScope = await resolveStudentScopeFilter(profile, query.studentId);
  res.status(200).json(await service.listStudentFees(studentScope));
}

export async function assignStudentFeeHandler(req: Request, res: Response): Promise<void> {
  const body = assignSchema.parse(req.body);
  const profile = await getActorProfile(req.user!.id);
  await assertStudentInScope(profile, body.studentId);
  res.status(201).json(await service.assignStudentFee(body, req.user!.id));
}

export async function archiveStudentFeeHandler(req: Request, res: Response): Promise<void> {
  const profile = await getActorProfile(req.user!.id);
  await assertStudentInScope(profile, await service.getStudentFeeStudentId(req.params.studentFeeId!));
  res.status(200).json(await service.archiveStudentFee(req.params.studentFeeId!, req.user!.id));
}
