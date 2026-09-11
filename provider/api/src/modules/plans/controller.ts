import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  tier: z.string().min(1).max(50),
  features: z.array(z.string().min(1)).default([]),
  maxStudents: z.number().int().positive(),
  maxCampuses: z.number().int().positive(),
  maxStaff: z.number().int().positive(),
  maxStorageMb: z.number().int().positive(),
});

const activeSchema = z.object({ isActive: z.boolean() });

export async function listPlansHandler(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await service.listPlans());
}

export async function createPlanHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  res.status(201).json(await service.createPlan(body, req.providerUser!.id));
}

export async function setPlanActiveHandler(req: Request, res: Response): Promise<void> {
  const body = activeSchema.parse(req.body);
  res.status(200).json(await service.setPlanActive(req.params.planId!, body.isActive, req.providerUser!.id));
}
