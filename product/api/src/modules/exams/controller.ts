import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";

const listQuerySchema = z.object({ academicYearId: z.string().uuid().optional() });
const createSchema = z.object({ academicYearId: z.string().uuid(), name: z.string().min(1) });

export async function listExamsHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  res.status(200).json(await service.listExams(query));
}

export async function getExamHandler(req: Request, res: Response): Promise<void> {
  res.status(200).json(await service.getExam(req.params.examId!));
}

export async function createExamHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  res.status(201).json(await service.createExam(body, req.user!.id));
}

export async function publishExamHandler(req: Request, res: Response): Promise<void> {
  res.status(200).json(await service.publishExam(req.params.examId!, req.user!.id));
}
