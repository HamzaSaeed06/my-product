import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";

const createSchema = z.object({
  timetableEntryId: z.string().uuid(),
  date: z.string().date(),
  substituteTeacherId: z.string().uuid(),
  reason: z.string().optional(),
});

const listQuerySchema = z.object({
  date: z.string().date().optional(),
  teacherId: z.string().uuid().optional(),
});

export async function createSubstitutionHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  res.status(201).json(await service.createSubstitution(body, req.user!.id));
}

export async function listSubstitutionsHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  res.status(200).json(await service.listSubstitutions(query));
}

export async function cancelSubstitutionHandler(req: Request, res: Response): Promise<void> {
  res.status(200).json(await service.cancelSubstitution(req.params.substitutionId!, req.user!.id));
}
