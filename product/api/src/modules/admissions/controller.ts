import type { Request, Response } from "express";
import { z } from "zod";
import * as admissionsService from "./service.js";

const listQuerySchema = z.object({
  studentId: z.string().uuid().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "WITHDRAWN"]).optional(),
});

const createSchema = z.object({
  studentId: z.string().uuid(),
  campusId: z.string().uuid(),
  classId: z.string().uuid(),
  academicYearId: z.string().uuid(),
});

const decisionNoteSchema = z.object({ decisionNote: z.string().max(1000).optional() });

export async function listAdmissionsHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  res.status(200).json(await admissionsService.listAdmissions(query));
}

export async function createAdmissionHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  const admission = await admissionsService.createAdmission(body, req.user!.id);
  res.status(201).json(admission);
}

export async function approveAdmissionHandler(req: Request, res: Response): Promise<void> {
  const body = decisionNoteSchema.parse(req.body);
  const admission = await admissionsService.decideAdmission(
    req.params.admissionId!,
    "APPROVED",
    body.decisionNote,
    req.user!.id
  );
  res.status(200).json(admission);
}

export async function rejectAdmissionHandler(req: Request, res: Response): Promise<void> {
  const body = decisionNoteSchema.parse(req.body);
  const admission = await admissionsService.decideAdmission(
    req.params.admissionId!,
    "REJECTED",
    body.decisionNote,
    req.user!.id
  );
  res.status(200).json(admission);
}

export async function withdrawAdmissionHandler(req: Request, res: Response): Promise<void> {
  const admission = await admissionsService.withdrawAdmission(req.params.admissionId!, req.user!.id);
  res.status(200).json(admission);
}
