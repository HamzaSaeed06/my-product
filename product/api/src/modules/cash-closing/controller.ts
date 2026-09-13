import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";
import { getActorProfile, assertCampusInScope } from "../../lib/scope.js";

const amountSchema = z.string().regex(/^-?\d+(\.\d{1,2})?$/, "must be a decimal number with up to 2 places");
const listQuerySchema = z.object({ campusId: z.string().uuid().optional() });

const createSchema = z.object({
  campusId: z.string().uuid(),
  date: z.coerce.date(),
  openingBalance: amountSchema,
  collections: amountSchema,
  refundsPaidOut: amountSchema,
  actualBalance: amountSchema,
});

export async function listCashClosingsHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  const profile = await getActorProfile(req.user!.id);
  if (query.campusId) assertCampusInScope(profile, query.campusId);
  const campusIdIn = !query.campusId && profile.campusIds.length > 0 ? profile.campusIds : undefined;
  res.status(200).json(await service.listCashClosings({ campusId: query.campusId, campusIdIn }));
}

export async function createCashClosingHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  const profile = await getActorProfile(req.user!.id);
  assertCampusInScope(profile, body.campusId);
  res.status(201).json(await service.createCashClosing(body, req.user!.id));
}

export async function approveCashClosingHandler(req: Request, res: Response): Promise<void> {
  const profile = await getActorProfile(req.user!.id);
  assertCampusInScope(profile, await service.getCashClosingCampusId(req.params.closingId!));
  res.status(200).json(await service.approveCashClosing(req.params.closingId!, req.user!.id));
}
