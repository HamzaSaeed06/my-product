import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";

const FREQUENCIES = ["MONTHLY", "ANNUAL", "ONE_TIME"] as const;

const listQuerySchema = z.object({ classId: z.string().uuid().optional() });

const createSchema = z.object({
  instituteId: z.string().uuid(),
  classId: z.string().uuid(),
  feeCategoryId: z.string().uuid(),
  name: z.string().min(1),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "amount must be a decimal number with up to 2 places"),
  frequency: z.enum(FREQUENCIES),
  effectiveFrom: z.coerce.date(),
  effectiveTo: z.coerce.date().optional(),
});

export async function listFeeStructuresHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  res.status(200).json(await service.listFeeStructures(query));
}

export async function createFeeStructureHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  res.status(201).json(await service.createFeeStructure(body, req.user!.id));
}

export async function archiveFeeStructureHandler(req: Request, res: Response): Promise<void> {
  res.status(200).json(await service.archiveFeeStructure(req.params.structureId!, req.user!.id));
}
