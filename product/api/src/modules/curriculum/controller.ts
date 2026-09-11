import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";

const listQuerySchema = z.object({
  subjectId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
  academicYearId: z.string().uuid().optional(),
});

const createSchema = z.object({
  subjectId: z.string().uuid(),
  classId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  topic: z.string().min(1),
  sortOrder: z.number().int().optional(),
  expectedCompletionDate: z.coerce.date().optional(),
});

const updateSchema = z.object({
  topic: z.string().min(1).optional(),
  sortOrder: z.number().int().optional(),
  expectedCompletionDate: z.coerce.date().nullable().optional(),
});

const progressSchema = z.object({
  completed: z.boolean(),
  notes: z.string().optional(),
});

export async function listCurriculumHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  res.status(200).json(await service.listCurriculum(query));
}

export async function createCurriculumTopicHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  res.status(201).json(await service.createCurriculumTopic(body, req.user!.id));
}

export async function updateCurriculumTopicHandler(req: Request, res: Response): Promise<void> {
  const body = updateSchema.parse(req.body);
  res.status(200).json(await service.updateCurriculumTopic(req.params.curriculumId!, body, req.user!.id));
}

export async function archiveCurriculumTopicHandler(req: Request, res: Response): Promise<void> {
  res.status(200).json(await service.archiveCurriculumTopic(req.params.curriculumId!, req.user!.id));
}

export async function markCurriculumProgressHandler(req: Request, res: Response): Promise<void> {
  const body = progressSchema.parse(req.body);
  const result = await service.markCurriculumProgress(req.params.curriculumId!, req.params.sectionId!, body, req.user!.id);
  res.status(200).json(result);
}
