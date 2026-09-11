import type { Request, Response } from "express";
import { z } from "zod";
import * as parentsService from "./service.js";

const createSchema = z.object({
  fullName: z.string().min(1).max(200),
  phone: z.string().min(1).max(50),
  email: z.string().email().optional(),
  address: z.string().max(500).optional(),
});

const updateSchema = createSchema.partial();

const linkChildSchema = z.object({
  studentId: z.string().uuid(),
  relationship: z.string().max(50).optional(),
  isPrimary: z.boolean().optional(),
});

export async function searchParentsHandler(req: Request, res: Response): Promise<void> {
  const phone = z.string().default("").parse(req.query.phone ?? "");
  res.status(200).json(await parentsService.searchParents(phone));
}

export async function listParentsHandler(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await parentsService.listParents());
}

export async function createParentHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  const parent = await parentsService.createParent(body, req.user!.id);
  res.status(201).json(parent);
}

export async function updateParentHandler(req: Request, res: Response): Promise<void> {
  const body = updateSchema.parse(req.body);
  const parent = await parentsService.updateParent(req.params.parentId!, body, req.user!.id);
  res.status(200).json(parent);
}

export async function linkChildHandler(req: Request, res: Response): Promise<void> {
  const body = linkChildSchema.parse(req.body);
  const link = await parentsService.linkChild(req.params.parentId!, body, req.user!.id);
  res.status(201).json(link);
}

export async function unlinkChildHandler(req: Request, res: Response): Promise<void> {
  await parentsService.unlinkChild(req.params.parentId!, req.params.linkId!, req.user!.id);
  res.status(204).send();
}
