import type { Request, Response } from "express";
import { z } from "zod";
import * as campusesService from "./service.js";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().max(500).optional(),
  phone: z.string().max(50).optional(),
});

const updateSchema = createSchema.partial();

export async function listCampusesHandler(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await campusesService.listCampuses());
}

export async function createCampusHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  const campus = await campusesService.createCampus(body, req.user!.id);
  res.status(201).json(campus);
}

export async function updateCampusHandler(req: Request, res: Response): Promise<void> {
  const body = updateSchema.parse(req.body);
  const campus = await campusesService.updateCampus(req.params.campusId!, body, req.user!.id);
  res.status(200).json(campus);
}

export async function archiveCampusHandler(req: Request, res: Response): Promise<void> {
  const campus = await campusesService.archiveCampus(req.params.campusId!, req.user!.id);
  res.status(200).json(campus);
}
