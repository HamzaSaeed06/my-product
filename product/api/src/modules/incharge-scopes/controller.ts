import type { Request, Response } from "express";
import { z } from "zod";
import * as inchargeScopesService from "./service.js";

const listQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  campusId: z.string().uuid().optional(),
});

const createSchema = z.object({
  userId: z.string().uuid(),
  campusId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  classIds: z.array(z.string().uuid()).min(1),
  sectionIds: z.array(z.string().uuid()).optional(),
  effectiveFrom: z.coerce.date().optional(),
  effectiveTo: z.coerce.date().optional(),
});

const updateSchema = z.object({
  classIds: z.array(z.string().uuid()).min(1).optional(),
  sectionIds: z.array(z.string().uuid()).optional(),
  effectiveTo: z.coerce.date().nullable().optional(),
  expectedVersion: z.number().int().nonnegative(),
});

export async function listInchargeScopesHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  res.status(200).json(await inchargeScopesService.listInchargeScopes(query));
}

export async function createInchargeScopeHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  const scope = await inchargeScopesService.createInchargeScope(body, req.user!.id);
  res.status(201).json(scope);
}

export async function updateInchargeScopeHandler(req: Request, res: Response): Promise<void> {
  const body = updateSchema.parse(req.body);
  const scope = await inchargeScopesService.updateInchargeScope(req.params.scopeId!, body, req.user!.id);
  res.status(200).json(scope);
}

export async function revokeInchargeScopeHandler(req: Request, res: Response): Promise<void> {
  const scope = await inchargeScopesService.revokeInchargeScope(req.params.scopeId!, req.user!.id);
  res.status(200).json(scope);
}
