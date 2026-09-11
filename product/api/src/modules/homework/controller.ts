import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";
import { getActorProfile, assertSectionQueryInScope } from "../../lib/scope.js";

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

export async function createHomeworkHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  const homework = await service.createHomework(body, req.file, req.user!.id);
  res.status(201).json(homework);
}

export async function listHomeworkHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  const profile = await getActorProfile(req.user!.id);
  await assertSectionQueryInScope(profile, query.sectionId);
  res.status(200).json(await service.listHomework(query));
}

export async function updateHomeworkHandler(req: Request, res: Response): Promise<void> {
  const body = updateSchema.parse(req.body);
  res.status(200).json(await service.updateHomework(req.params.homeworkId!, body, req.user!.id));
}

export async function publishHomeworkHandler(req: Request, res: Response): Promise<void> {
  res.status(200).json(await service.publishHomework(req.params.homeworkId!, req.user!.id));
}

export async function archiveHomeworkHandler(req: Request, res: Response): Promise<void> {
  res.status(200).json(await service.archiveHomework(req.params.homeworkId!, req.user!.id));
}
