import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";
import { getActorProfile, assertSectionQueryInScope } from "../../lib/scope.js";

const createSchema = z.object({
  subjectId: z.string().uuid(),
  sectionId: z.string().uuid(),
  classId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  teacherId: z.string().uuid(),
  title: z.string().min(1),
  totalMarks: z.number().int().positive(),
  assessmentDate: z.coerce.date(),
});

const listQuerySchema = z.object({
  sectionId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  academicYearId: z.string().uuid().optional(),
});

const enterMarksSchema = z.object({
  studentId: z.string().uuid(),
  marksObtained: z.number().min(0),
  remarks: z.string().optional(),
});

const correctionSchema = z.object({
  newMarks: z.number().min(0),
  reason: z.string().min(1),
});

const decideSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  decisionNote: z.string().optional(),
});

export async function createAssessmentHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  res.status(201).json(await service.createAssessment(body, req.user!.id));
}

export async function listAssessmentsHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  const profile = await getActorProfile(req.user!.id);
  await assertSectionQueryInScope(profile, query.sectionId);
  res.status(200).json(await service.listAssessments(query));
}

export async function getAssessmentHandler(req: Request, res: Response): Promise<void> {
  res.status(200).json(await service.getAssessment(req.params.assessmentId!));
}

export async function enterMarksHandler(req: Request, res: Response): Promise<void> {
  const body = enterMarksSchema.parse(req.body);
  res.status(200).json(await service.enterMarks(req.params.assessmentId!, body, req.user!.id));
}

export async function submitAssessmentHandler(req: Request, res: Response): Promise<void> {
  res.status(200).json(await service.submitAssessment(req.params.assessmentId!, req.user!.id));
}

export async function archiveAssessmentHandler(req: Request, res: Response): Promise<void> {
  res.status(200).json(await service.archiveAssessment(req.params.assessmentId!, req.user!.id));
}

export async function requestMarksCorrectionHandler(req: Request, res: Response): Promise<void> {
  const body = correctionSchema.parse(req.body);
  const request = await service.requestMarksCorrection(req.params.resultId!, body, req.user!.id);
  res.status(201).json(request);
}

export async function decideMarksCorrectionHandler(req: Request, res: Response): Promise<void> {
  const body = decideSchema.parse(req.body);
  const result = await service.decideMarksCorrection(req.params.approvalId!, body.decision, body.decisionNote, req.user!.id);
  res.status(200).json(result);
}
