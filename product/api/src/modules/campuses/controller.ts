import type { Request, Response } from "express";
import { z } from "zod";
import * as campusesService from "./service.js";
import { getActorProfile } from "../../lib/scope.js";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().max(500).optional(),
  phone: z.string().max(50).optional(),
});

const updateSchema = createSchema.partial();

export async function listCampusesHandler(req: Request, res: Response): Promise<void> {
  const profile = await getActorProfile(req.user!.id);
  // CAMPUS_HEAD/OFFICE see only their own campus(es), never every campus in
  // the institute — see docs/PHASE_11A_CAMPUS_SCOPING_IMPLEMENTATION_PLAN.md
  // Group 1. Every other role currently holding campus.view is SUPER_ADMIN
  // only (per seed.ts), so campusIds.length === 0 here means unrestricted.
  const campusIdIn = profile.campusIds.length > 0 ? profile.campusIds : undefined;
  res.status(200).json(await campusesService.listCampuses(campusIdIn));
}

export async function createCampusHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  const campus = await campusesService.createCampus(body, req.user!.id);
  res.status(201).json(campus);
}

export async function updateCampusHandler(req: Request, res: Response): Promise<void> {
  const body = updateSchema.parse(req.body);
  const campus = await campusesService.updateCampus(req.params.campusId!, body, req.user!.id);
  res.status(200).json(campus);
}

export async function archiveCampusHandler(req: Request, res: Response): Promise<void> {
  const campus = await campusesService.archiveCampus(req.params.campusId!, req.user!.id);
  res.status(200).json(campus);
}
