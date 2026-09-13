import type { Request, Response } from "express";
import { z } from "zod";
import * as sectionsService from "./service.js";
import { getActorProfile, assertCampusInScope, isUnrestricted } from "../../lib/scope.js";
import { getInchargeScopedSectionIds } from "../incharge-scopes/service.js";

const listQuerySchema = z.object({
  classId: z.string().uuid().optional(),
  campusId: z.string().uuid().optional(),
  academicYearId: z.string().uuid().optional(),
});

const createSchema = z.object({
  classId: z.string().uuid(),
  campusId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  name: z.string().min(1).max(100),
  capacity: z.number().int().positive().optional(),
  classTeacherId: z.string().uuid().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  capacity: z.number().int().positive().optional(),
  classTeacherId: z.string().uuid().nullable().optional(),
});

export async function listSectionsHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  const profile = await getActorProfile(req.user!.id);

  // SUPER_ADMIN: unrestricted (optional query filters still apply).
  if (isUnrestricted(profile)) {
    res.status(200).json(await sectionsService.listSections(query));
    return;
  }

  // CAMPUS_HEAD / OFFICE: own campus(es). A named campusId must be in scope.
  if (profile.campusIds.length > 0) {
    if (query.campusId) assertCampusInScope(profile, query.campusId);
    const campusIdIn = query.campusId ? undefined : profile.campusIds;
    res.status(200).json(await sectionsService.listSections({ ...query, campusIdIn }));
    return;
  }

  // INCHARGE: only the sections their active scope covers — previously this
  // branch fell through to an unfiltered "list every section in the
  // institute" (the §19/§50 leak this fixes). getInchargeScopedSectionIds
  // returns [] for an actor with no active scope → nothing, never all.
  if (profile.roles.includes("INCHARGE")) {
    const sectionIdIn = await getInchargeScopedSectionIds(profile.userId);
    res.status(200).json(await sectionsService.listSections({ ...query, sectionIdIn }));
    return;
  }

  // Any other actor that somehow reaches this route (no permission grant
  // currently allows it): never leak — return nothing.
  res.status(200).json([]);
}

export async function createSectionHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  const profile = await getActorProfile(req.user!.id);
  assertCampusInScope(profile, body.campusId);
  const section = await sectionsService.createSection(body, req.user!.id);
  res.status(201).json(section);
}

export async function updateSectionHandler(req: Request, res: Response): Promise<void> {
  const body = updateSchema.parse(req.body);
  const profile = await getActorProfile(req.user!.id);
  assertCampusInScope(profile, await sectionsService.getSectionCampusId(req.params.sectionId!));
  const section = await sectionsService.updateSection(req.params.sectionId!, body, req.user!.id);
  res.status(200).json(section);
}

export async function archiveSectionHandler(req: Request, res: Response): Promise<void> {
  const profile = await getActorProfile(req.user!.id);
  assertCampusInScope(profile, await sectionsService.getSectionCampusId(req.params.sectionId!));
  const section = await sectionsService.archiveSection(req.params.sectionId!, req.user!.id);
  res.status(200).json(section);
}
