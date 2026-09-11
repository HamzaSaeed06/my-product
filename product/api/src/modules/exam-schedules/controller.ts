import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";

const listQuerySchema = z.object({
  examId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
});

const createSchema = z.object({
  examId: z.string().uuid(),
  subjectId: z.string().uuid(),
  classId: z.string().uuid(),
  sectionId: z.string().uuid(),
  date: z.coerce.date(),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  room: z.string().optional(),
});

const updateSchema = z.object({
  date: z.coerce.date().optional(),
  startTime: z.string().min(1).optional(),
  endTime: z.string().min(1).optional(),
  room: z.string().optional(),
});

export async function listExamSchedulesHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  res.status(200).json(await service.listExamSchedules(query));
}

export async function createExamScheduleHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  res.status(201).json(await service.createExamSchedule(body, req.user!.id));
}

export async function updateExamScheduleHandler(req: Request, res: Response): Promise<void> {
  const body = updateSchema.parse(req.body);
  res.status(200).json(await service.updateExamSchedule(req.params.scheduleId!, body, req.user!.id));
}
