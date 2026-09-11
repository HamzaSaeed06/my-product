import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";

const getOrCreateQuerySchema = z.object({
  examId: z.string().uuid(),
  sectionId: z.string().uuid(),
});

const enterItemSchema = z.object({
  subjectId: z.string().uuid(),
  marksObtained: z.number().min(0),
  totalMarks: z.number().positive(),
  grade: z.string().optional(),
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

export async function getOrCreateResultsHandler(req: Request, res: Response): Promise<void> {
  const query = getOrCreateQuerySchema.parse(req.query);
  res.status(200).json(await service.getOrCreateResultsForSection(query.examId, query.sectionId));
}

export async function getResultHandler(req: Request, res: Response): Promise<void> {
  res.status(200).json(await service.getResult(req.params.resultId!));
}

export async function enterResultItemHandler(req: Request, res: Response): Promise<void> {
  const body = enterItemSchema.parse(req.body);
  res.status(200).json(await service.enterResultItem(req.params.resultId!, body, req.user!.id));
}

export async function submitResultHandler(req: Request, res: Response): Promise<void> {
  res.status(200).json(await service.submitResult(req.params.resultId!, req.user!.id));
}

export async function reviewResultHandler(req: Request, res: Response): Promise<void> {
  res.status(200).json(await service.reviewResult(req.params.resultId!, req.user!.id));
}

export async function finalizeResultHandler(req: Request, res: Response): Promise<void> {
  res.status(200).json(await service.finalizeResult(req.params.resultId!, req.user!.id));
}

export async function publishResultHandler(req: Request, res: Response): Promise<void> {
  res.status(200).json(await service.publishResult(req.params.resultId!, req.user!.id));
}

export async function requestResultCorrectionHandler(req: Request, res: Response): Promise<void> {
  const body = correctionSchema.parse(req.body);
  const request = await service.requestResultCorrection(req.params.itemId!, body, req.user!.id);
  res.status(201).json(request);
}

export async function decideResultCorrectionHandler(req: Request, res: Response): Promise<void> {
  const body = decideSchema.parse(req.body);
  const result = await service.decideResultCorrection(req.params.approvalId!, body.decision, body.decisionNote, req.user!.id);
  res.status(200).json(result);
}
