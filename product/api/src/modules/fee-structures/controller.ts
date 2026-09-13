import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";
import { getActorProfile, assertCampusInScope } from "../../lib/scope.js";
import { HttpError } from "../../middleware/errorHandler.js";

const FREQUENCIES = ["MONTHLY", "ANNUAL", "ONE_TIME"] as const;

const listQuerySchema = z.object({ classId: z.string().uuid().optional(), campusId: z.string().uuid().optional() });

const createSchema = z.object({
  instituteId: z.string().uuid(),
  // Omit for an institute-wide fee structure (shared across every campus);
  // set for a campus-specific one. See
  // docs/PHASE_11A_CAMPUS_SCOPING_IMPLEMENTATION_PLAN.md "Gap 1".
  campusId: z.string().uuid().optional(),
  classId: z.string().uuid(),
  feeCategoryId: z.string().uuid(),
  name: z.string().min(1),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "amount must be a decimal number with up to 2 places"),
  frequency: z.enum(FREQUENCIES),
  effectiveFrom: z.coerce.date(),
  effectiveTo: z.coerce.date().optional(),
});

export async function listFeeStructuresHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  const profile = await getActorProfile(req.user!.id);
  if (query.campusId) assertCampusInScope(profile, query.campusId);
  const campusIdInOrNull = !query.campusId && profile.campusIds.length > 0 ? profile.campusIds : undefined;
  res.status(200).json(await service.listFeeStructures({ ...query, campusIdInOrNull }));
}

export async function createFeeStructureHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  const profile = await getActorProfile(req.user!.id);
  if (profile.campusIds.length > 0) {
    // Campus Head/Office can only create a campus-specific fee structure
    // for their own campus — never an institute-wide one (that affects
    // every campus, so it stays Super-Admin/Office-without-campus only).
    if (!body.campusId) {
      throw new HttpError(400, "CAMPUS_REQUIRED", "campusId is required for a campus-scoped fee structure");
    }
    assertCampusInScope(profile, body.campusId);
  }
  res.status(201).json(await service.createFeeStructure(body, req.user!.id));
}

export async function archiveFeeStructureHandler(req: Request, res: Response): Promise<void> {
  const profile = await getActorProfile(req.user!.id);
  const campusId = await service.getFeeStructureCampusId(req.params.structureId!);
  if (profile.campusIds.length > 0) {
    if (!campusId) throw new HttpError(403, "OUT_OF_SCOPE", "Only Super Admin can archive an institute-wide fee structure");
    assertCampusInScope(profile, campusId);
  }
  res.status(200).json(await service.archiveFeeStructure(req.params.structureId!, req.user!.id));
}
