import type { Request, Response } from "express";
import { z } from "zod";
import * as attendanceService from "./service.js";

const STATUS = ["PRESENT", "ABSENT", "LEAVE"] as const;

const markSchema = z.object({
  sectionId: z.string().uuid(),
  date: z.string().date(),
  entries: z.array(z.object({ studentId: z.string().uuid(), status: z.enum(STATUS) })).min(1),
});

const listQuerySchema = z.object({
  sectionId: z.string().uuid().optional(),
  studentId: z.string().uuid().optional(),
  date: z.string().date().optional(),
});

const correctionSchema = z.object({
  newStatus: z.enum(STATUS),
  reason: z.string().min(1),
});

const decideSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  decisionNote: z.string().optional(),
});

export async function markAttendanceHandler(req: Request, res: Response): Promise<void> {
  const body = markSchema.parse(req.body);
  const result = await attendanceService.markAttendance(body, req.user!.id);
  res.status(201).json(result);
}

export async function listAttendanceHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  res.status(200).json(await attendanceService.listAttendance(query));
}

export async function requestAttendanceCorrectionHandler(req: Request, res: Response): Promise<void> {
  const body = correctionSchema.parse(req.body);
  const request = await attendanceService.requestAttendanceCorrection(req.params.attendanceId!, body, req.user!.id);
  res.status(201).json(request);
}

export async function decideAttendanceCorrectionHandler(req: Request, res: Response): Promise<void> {
  const body = decideSchema.parse(req.body);
  const result = await attendanceService.decideAttendanceCorrection(
    req.params.approvalId!,
    body.decision,
    body.decisionNote,
    req.user!.id
  );
  res.status(200).json(result);
}
