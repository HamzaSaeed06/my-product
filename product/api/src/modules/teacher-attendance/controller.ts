import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";

const STATUS = ["PRESENT", "ABSENT", "LEAVE"] as const;

const markSchema = z.object({
  teacherId: z.string().uuid(),
  date: z.string().date(),
  status: z.enum(STATUS),
});

const listQuerySchema = z.object({
  teacherId: z.string().uuid().optional(),
  date: z.string().date().optional(),
});

const correctSchema = z.object({ status: z.enum(STATUS) });

export async function markTeacherAttendanceHandler(req: Request, res: Response): Promise<void> {
  const body = markSchema.parse(req.body);
  res.status(201).json(await service.markTeacherAttendance(body, req.user!.id));
}

export async function listTeacherAttendanceHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  res.status(200).json(await service.listTeacherAttendance(query));
}

export async function correctTeacherAttendanceHandler(req: Request, res: Response): Promise<void> {
  const body = correctSchema.parse(req.body);
  res.status(200).json(await service.correctTeacherAttendance(req.params.recordId!, body.status, req.user!.id));
}
