import type { Request, Response } from "express";
import { z } from "zod";
import * as subjectsService from "./service.js";

const createSchema = z.object({ name: z.string().min(1).max(100), code: z.string().max(30).optional() });
const updateSchema = createSchema.partial();

export async function listSubjectsHandler(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await subjectsService.listSubjects());
}

export async function createSubjectHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  const subject = await subjectsService.createSubject(body, req.user!.id);
  res.status(201).json(subject);
}

export async function updateSubjectHandler(req: Request, res: Response): Promise<void> {
  const body = updateSchema.parse(req.body);
  const subject = await subjectsService.updateSubject(req.params.subjectId!, body, req.user!.id);
  res.status(200).json(subject);
}

export async function archiveSubjectHandler(req: Request, res: Response): Promise<void> {
  const subject = await subjectsService.archiveSubject(req.params.subjectId!, req.user!.id);
  res.status(200).json(subject);
}
