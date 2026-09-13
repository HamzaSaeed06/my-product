import type { Request, Response } from "express";
import { z } from "zod";
import * as parentsService from "./service.js";
import { getActorProfile, assertStudentInScope } from "../../lib/scope.js";
import { HttpError } from "../../middleware/errorHandler.js";

const createSchema = z.object({
  fullName: z.string().min(1).max(200),
  phone: z.string().min(1).max(50),
  email: z.string().email().optional(),
  address: z.string().max(500).optional(),
  nationalId: z.string().min(1).max(50).optional(),
});

const updateSchema = createSchema.partial();

const linkChildSchema = z.object({
  studentId: z.string().uuid(),
  relationship: z.string().max(50).optional(),
  isPrimary: z.boolean().optional(),
});

export async function searchParentsHandler(req: Request, res: Response): Promise<void> {
  const phone = z.string().default("").parse(req.query.phone ?? "");
  res.status(200).json(await parentsService.searchParents(phone));
}

export async function listParentsHandler(req: Request, res: Response): Promise<void> {
  const profile = await getActorProfile(req.user!.id);
  const campusIdIn = profile.campusIds.length > 0 ? profile.campusIds : undefined;
  res.status(200).json(await parentsService.listParents(campusIdIn));
}

export async function createParentHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  const parent = await parentsService.createParent(body, req.user!.id);
  res.status(201).json(parent);
}

// Only enforces for a campus-assigned actor (CAMPUS_HEAD/OFFICE) — a Parent
// with zero linked children yet (mid-admission) has no derivable campus,
// same "can't verify, so refuse" stance as leaves/complaints' equivalents.
async function assertParentInScope(profile: Awaited<ReturnType<typeof getActorProfile>>, parentId: string): Promise<void> {
  if (profile.campusIds.length === 0) return;
  const parentCampusIds = await parentsService.getParentCampusIds(parentId);
  if (!parentCampusIds.some((id) => profile.campusIds.includes(id))) {
    throw new HttpError(403, "OUT_OF_SCOPE", "You do not have access to this parent");
  }
}

export async function updateParentHandler(req: Request, res: Response): Promise<void> {
  const body = updateSchema.parse(req.body);
  const profile = await getActorProfile(req.user!.id);
  await assertParentInScope(profile, req.params.parentId!);
  const parent = await parentsService.updateParent(req.params.parentId!, body, req.user!.id);
  res.status(200).json(parent);
}

export async function linkChildHandler(req: Request, res: Response): Promise<void> {
  const body = linkChildSchema.parse(req.body);
  const profile = await getActorProfile(req.user!.id);
  // The meaningful check here is the STUDENT being attached, not the
  // parent's other unrelated children (a parent can legitimately have
  // children across campuses) — an Office/Campus Head may only link a
  // student who is actually in their own scope.
  await assertStudentInScope(profile, body.studentId);
  const link = await parentsService.linkChild(req.params.parentId!, body, req.user!.id);
  res.status(201).json(link);
}

export async function unlinkChildHandler(req: Request, res: Response): Promise<void> {
  const profile = await getActorProfile(req.user!.id);
  await assertStudentInScope(profile, await parentsService.getStudentParentLinkStudentId(req.params.linkId!));
  await parentsService.unlinkChild(req.params.parentId!, req.params.linkId!, req.user!.id);
  res.status(204).send();
}
