import type { Request, Response } from "express";
import { z } from "zod";
import * as instituteService from "./service.js";
import { HttpError } from "../../middleware/errorHandler.js";

const InstituteTypeEnum = z.enum(["SCHOOL", "ACADEMY", "COACHING_CENTER", "INSTITUTE"]);

const createSchema = z.object({
  name: z.string().min(1).max(200),
  type: InstituteTypeEnum.optional(),
  logoUrl: z.string().url().optional(),
  address: z.string().max(500).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
});

const updateSchema = createSchema.partial();

const settingsSchema = z.object({
  timezone: z.string().max(100).optional(),
  locale: z.string().max(20).optional(),
  currency: z.string().max(10).optional(),
  studentLabel: z.string().max(50).optional(),
  teacherLabel: z.string().max(50).optional(),
  classLabel: z.string().max(50).optional(),
  sectionLabel: z.string().max(50).optional(),
});

export async function getInstituteHandler(_req: Request, res: Response): Promise<void> {
  const institute = await instituteService.getInstitute();
  if (!institute) {
    throw new HttpError(404, "INSTITUTE_NOT_CONFIGURED", "No institute has been configured yet");
  }
  res.status(200).json(institute);
}

export async function createInstituteHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  const institute = await instituteService.createInstitute(body, req.user!.id);
  res.status(201).json(institute);
}

export async function updateInstituteHandler(req: Request, res: Response): Promise<void> {
  const body = updateSchema.parse(req.body);
  const institute = await instituteService.updateInstitute(body, req.user!.id);
  res.status(200).json(institute);
}

export async function updateSettingsHandler(req: Request, res: Response): Promise<void> {
  const body = settingsSchema.parse(req.body);
  const settings = await instituteService.updateInstituteSettings(body, req.user!.id);
  res.status(200).json(settings);
}
