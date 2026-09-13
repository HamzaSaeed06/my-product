import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";
import { getActorProfile, resolveSectionScopeFilter, assertSectionInScope } from "../../lib/scope.js";
import { HttpError } from "../../middleware/errorHandler.js";

const createSchema = z.object({
  subjectId: z.string().uuid(),
  sectionId: z.string().uuid(),
  classId: z.string().uuid(),
  teacherId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.coerce.date(),
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  dueDate: z.coerce.date().optional(),
});

const listQuerySchema = z.object({
  sectionId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
});

// Only TEACHER holds homework.create today (spec: "Teacher: teaching staff
// (academics, attendance, homework)") — but the body still names a
// teacherId explicitly (needed for future roles/admin-on-behalf-of
// creation), so a Teacher must not be able to post homework under a
// different teacher's name. Same pattern as leaves/teacher-assignments/
// teacher-attendance controllers.
function assertOwnTeacherId(profile: Awaited<ReturnType<typeof getActorProfile>>, teacherId: string): void {
  if (profile.roles.includes("TEACHER") && teacherId !== profile.teacherId) {
    throw new HttpError(403, "OUT_OF_SCOPE", "You cannot create homework as a different teacher");
  }
}

export async function createHomeworkHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  const profile = await getActorProfile(req.user!.id);
  assertOwnTeacherId(profile, body.teacherId);
  await assertSectionInScope(profile, body.sectionId);
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const homework = await service.createHomework(body, files, req.user!.id);
  res.status(201).json(homework);
}

export async function addHomeworkAttachmentHandler(req: Request, res: Response): Promise<void> {
  const profile = await getActorProfile(req.user!.id);
  await assertSectionInScope(profile, await service.getHomeworkSectionId(req.params.homeworkId!));
  if (!req.file) throw new HttpError(400, "FILE_REQUIRED", "A file is required");
  const attachment = await service.addHomeworkAttachment(req.params.homeworkId!, req.file, req.user!.id);
  res.status(201).json(attachment);
}

export async function listHomeworkHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  const profile = await getActorProfile(req.user!.id);
  const scope = await resolveSectionScopeFilter(profile, query.sectionId);
  res.status(200).json(await service.listHomework({ subjectId: query.subjectId, classId: query.classId, scope }));
}

export async function updateHomeworkHandler(req: Request, res: Response): Promise<void> {
  const body = updateSchema.parse(req.body);
  const profile = await getActorProfile(req.user!.id);
  await assertSectionInScope(profile, await service.getHomeworkSectionId(req.params.homeworkId!));
  res.status(200).json(await service.updateHomework(req.params.homeworkId!, body, req.user!.id));
}

export async function publishHomeworkHandler(req: Request, res: Response): Promise<void> {
  const profile = await getActorProfile(req.user!.id);
  await assertSectionInScope(profile, await service.getHomeworkSectionId(req.params.homeworkId!));
  res.status(200).json(await service.publishHomework(req.params.homeworkId!, req.user!.id));
}

export async function archiveHomeworkHandler(req: Request, res: Response): Promise<void> {
  const profile = await getActorProfile(req.user!.id);
  await assertSectionInScope(profile, await service.getHomeworkSectionId(req.params.homeworkId!));
  res.status(200).json(await service.archiveHomework(req.params.homeworkId!, req.user!.id));
}
