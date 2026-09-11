import type { Request, Response } from "express";
import { z } from "zod";
import * as sectionsService from "./service.js";

const listQuerySchema = z.object({
  classId: z.string().uuid().optional(),
  campusId: z.string().uuid().optional(),
  academicYearId: z.string().uuid().optional(),
});

const createSchema = z.object({
  classId: z.string().uuid(),
  campusId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  name: z.string().min(1).max(100),
  capacity: z.number().int().positive().optional(),
  classTeacherId: z.string().uuid().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  capacity: z.number().int().positive().optional(),
  classTeacherId: z.string().uuid().nullable().optional(),
});

export async function listSectionsHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  res.status(200).json(await sectionsService.listSections(query));
}

export async function createSectionHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  const section = await sectionsService.createSection(body, req.user!.id);
  res.status(201).json(section);
}

export async function updateSectionHandler(req: Request, res: Response): Promise<void> {
  const body = updateSchema.parse(req.body);
  const section = await sectionsService.updateSection(req.params.sectionId!, body, req.user!.id);
  res.status(200).json(section);
}

export async function archiveSectionHandler(req: Request, res: Response): Promise<void> {
  const section = await sectionsService.archiveSection(req.params.sectionId!, req.user!.id);
  res.status(200).json(section);
}
