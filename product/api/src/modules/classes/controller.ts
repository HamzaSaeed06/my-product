import type { Request, Response } from "express";
import { z } from "zod";
import * as classesService from "./service.js";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  sortOrder: z.number().int().optional(),
});

const updateSchema = createSchema.partial();

export async function listClassesHandler(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await classesService.listClasses());
}

export async function createClassHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  const klass = await classesService.createClass(body, req.user!.id);
  res.status(201).json(klass);
}

export async function updateClassHandler(req: Request, res: Response): Promise<void> {
  const body = updateSchema.parse(req.body);
  const klass = await classesService.updateClass(req.params.classId!, body, req.user!.id);
  res.status(200).json(klass);
}

export async function archiveClassHandler(req: Request, res: Response): Promise<void> {
  const klass = await classesService.archiveClass(req.params.classId!, req.user!.id);
  res.status(200).json(klass);
}
