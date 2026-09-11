import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";

const createSchema = z.object({ instituteId: z.string().uuid(), name: z.string().min(1) });

export async function listFeeCategoriesHandler(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await service.listFeeCategories());
}

export async function createFeeCategoryHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  res.status(201).json(await service.createFeeCategory(body, req.user!.id));
}

export async function archiveFeeCategoryHandler(req: Request, res: Response): Promise<void> {
  res.status(200).json(await service.archiveFeeCategory(req.params.categoryId!, req.user!.id));
}
