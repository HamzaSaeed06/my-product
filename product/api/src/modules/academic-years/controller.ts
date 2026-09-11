import type { Request, Response } from "express";
import { z } from "zod";
import * as academicYearsService from "./service.js";

const createSchema = z.object({
  name: z.string().min(1).max(50),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export async function listAcademicYearsHandler(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await academicYearsService.listAcademicYears());
}

export async function createAcademicYearHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  const academicYear = await academicYearsService.createAcademicYear(body, req.user!.id);
  res.status(201).json(academicYear);
}

export async function updateAcademicYearHandler(req: Request, res: Response): Promise<void> {
  const body = updateSchema.parse(req.body);
  const academicYear = await academicYearsService.updateAcademicYear(
    req.params.academicYearId!,
    body,
    req.user!.id
  );
  res.status(200).json(academicYear);
}

export async function closeAcademicYearHandler(req: Request, res: Response): Promise<void> {
  const academicYear = await academicYearsService.closeAcademicYear(req.params.academicYearId!, req.user!.id);
  res.status(200).json(academicYear);
}
