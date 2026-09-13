import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";
import { getActorProfile, resolveSectionScopeFilter, assertSectionInScope } from "../../lib/scope.js";
import { HttpError } from "../../middleware/errorHandler.js";

const createSchema = z.object({
  sectionId: z.string().uuid(),
  subjectId: z.string().uuid().optional(),
  teacherId: z.string().uuid(),
  date: z.coerce.date(),
  note: z.string().min(1).max(2000),
});

const updateSchema = z.object({
  note: z.string().min(1).max(2000),
});

const listQuerySchema = z.object({
  sectionId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  date: z.string().date().optional(),
});

// Same self-attribution guard as homework — only TEACHER holds
// class_diary.create, and a Teacher must not post a diary entry under a
// different teacher's name.
function assertOwnTeacherId(profile: Awaited<ReturnType<typeof getActorProfile>>, teacherId: string): void {
  if (profile.roles.includes("TEACHER") && teacherId !== profile.teacherId) {
    throw new HttpError(403, "OUT_OF_SCOPE", "You cannot post a class diary entry as a different teacher");
  }
}

export async function createClassDiaryEntryHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  const profile = await getActorProfile(req.user!.id);
  assertOwnTeacherId(profile, body.teacherId);
  await assertSectionInScope(profile, body.sectionId);
  res.status(201).json(await service.createClassDiaryEntry(body, req.user!.id));
}

export async function listClassDiaryEntriesHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  const profile = await getActorProfile(req.user!.id);
  const scope = await resolveSectionScopeFilter(profile, query.sectionId);
  res.status(200).json(await service.listClassDiaryEntries({ subjectId: query.subjectId, date: query.date, scope }));
}

export async function updateClassDiaryEntryHandler(req: Request, res: Response): Promise<void> {
  const body = updateSchema.parse(req.body);
  const profile = await getActorProfile(req.user!.id);
  await assertSectionInScope(profile, await service.getClassDiaryEntrySectionId(req.params.entryId!));
  res.status(200).json(await service.updateClassDiaryEntry(req.params.entryId!, body, req.user!.id));
}

export async function archiveClassDiaryEntryHandler(req: Request, res: Response): Promise<void> {
  const profile = await getActorProfile(req.user!.id);
  await assertSectionInScope(profile, await service.getClassDiaryEntrySectionId(req.params.entryId!));
  res.status(200).json(await service.archiveClassDiaryEntry(req.params.entryId!, req.user!.id));
}
