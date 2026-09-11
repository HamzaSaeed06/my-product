import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";

const listQuerySchema = z.object({
  studentId: z.string().uuid().optional(),
  teacherId: z.string().uuid().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]).optional(),
});

const createSchema = z.object({
  subjectType: z.enum(["STUDENT", "TEACHER"]),
  studentId: z.string().uuid().optional(),
  teacherId: z.string().uuid().optional(),
  fromDate: z.coerce.date(),
  toDate: z.coerce.date(),
  reason: z.string().min(1),
});

const decideSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  decisionNote: z.string().optional(),
});

export async function listLeavesHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  res.status(200).json(await service.listLeaves(query));
}

export async function createLeaveHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  res.status(201).json(await service.createLeave(body, req.user!.id));
}

export async function decideLeaveHandler(req: Request, res: Response): Promise<void> {
  const body = decideSchema.parse(req.body);
  res.status(200).json(await service.decideLeave(req.params.leaveId!, body.decision, body.decisionNote, req.user!.id));
}

export async function cancelLeaveHandler(req: Request, res: Response): Promise<void> {
  res.status(200).json(await service.cancelLeave(req.params.leaveId!, req.user!.id));
}
