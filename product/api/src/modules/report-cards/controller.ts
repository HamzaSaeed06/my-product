import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";
import { getActorProfile, resolveStudentScopeFilter, assertStudentInScope } from "../../lib/scope.js";

const generateSchema = z.object({ resultId: z.string().uuid() });
const listQuerySchema = z.object({
  examId: z.string().uuid().optional(),
  studentId: z.string().uuid().optional(),
});

export async function generateReportCardHandler(req: Request, res: Response): Promise<void> {
  const body = generateSchema.parse(req.body);
  res.status(201).json(await service.generateReportCard(body.resultId, req.user!.id));
}

export async function listReportCardsHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  const profile = await getActorProfile(req.user!.id);
  const studentScope = await resolveStudentScopeFilter(profile, query.studentId);
  res.status(200).json(await service.listReportCards({ examId: query.examId, ...studentScope }));
}

export async function getReportCardHandler(req: Request, res: Response): Promise<void> {
  const reportCard = await service.getReportCard(req.params.reportCardId!);
  const profile = await getActorProfile(req.user!.id);
  await assertStudentInScope(profile, reportCard.result.studentId);
  res.status(200).json(reportCard);
}
