import type { Request, Response } from "express";
import { z } from "zod";
import * as admissionsService from "./service.js";
import { getActorProfile, assertCampusInScope } from "../../lib/scope.js";

const listQuerySchema = z.object({
  studentId: z.string().uuid().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "WITHDRAWN"]).optional(),
  // For an unrestricted actor (SUPER_ADMIN) drilling into one campus, e.g.
  // from the Institute Overview dashboard.
  campusId: z.string().uuid().optional(),
});

const createSchema = z.object({
  studentId: z.string().uuid(),
  campusId: z.string().uuid(),
  classId: z.string().uuid(),
  academicYearId: z.string().uuid(),
});

const decisionNoteSchema = z.object({ decisionNote: z.string().max(1000).optional() });

export async function listAdmissionsHandler(req: Request, res: Response): Promise<void> {
  const { campusId, ...query } = listQuerySchema.parse(req.query);
  const profile = await getActorProfile(req.user!.id);
  const campusIdIn = profile.campusIds.length > 0 ? profile.campusIds : campusId ? [campusId] : undefined;
  res.status(200).json(await admissionsService.listAdmissions({ ...query, campusIdIn }));
}

export async function createAdmissionHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  const profile = await getActorProfile(req.user!.id);
  assertCampusInScope(profile, body.campusId);
  const admission = await admissionsService.createAdmission(body, req.user!.id);
  res.status(201).json(admission);
}

export async function approveAdmissionHandler(req: Request, res: Response): Promise<void> {
  const body = decisionNoteSchema.parse(req.body);
  const profile = await getActorProfile(req.user!.id);
  assertCampusInScope(profile, await admissionsService.getAdmissionCampusId(req.params.admissionId!));
  const admission = await admissionsService.decideAdmission(
    req.params.admissionId!,
    "APPROVED",
    body.decisionNote,
    req.user!.id
  );
  res.status(200).json(admission);
}

export async function rejectAdmissionHandler(req: Request, res: Response): Promise<void> {
  const body = decisionNoteSchema.parse(req.body);
  const profile = await getActorProfile(req.user!.id);
  assertCampusInScope(profile, await admissionsService.getAdmissionCampusId(req.params.admissionId!));
  const admission = await admissionsService.decideAdmission(
    req.params.admissionId!,
    "REJECTED",
    body.decisionNote,
    req.user!.id
  );
  res.status(200).json(admission);
}

export async function withdrawAdmissionHandler(req: Request, res: Response): Promise<void> {
  const profile = await getActorProfile(req.user!.id);
  assertCampusInScope(profile, await admissionsService.getAdmissionCampusId(req.params.admissionId!));
  const admission = await admissionsService.withdrawAdmission(req.params.admissionId!, req.user!.id);
  res.status(200).json(admission);
}
