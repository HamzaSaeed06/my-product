import type { Request, Response } from "express";
import { z } from "zod";
import * as timetableService from "./service.js";

const DAY_OF_WEEK = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;

const getOrCreateQuerySchema = z.object({
  sectionId: z.string().uuid(),
  academicYearId: z.string().uuid(),
});

const addEntrySchema = z.object({
  dayOfWeek: z.enum(DAY_OF_WEEK),
  periodNumber: z.number().int().min(1),
  subjectId: z.string().uuid(),
  teacherId: z.string().uuid(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

const updateEntrySchema = addEntrySchema.partial();

export async function getOrCreateTimetableHandler(req: Request, res: Response): Promise<void> {
  const query = getOrCreateQuerySchema.parse(req.query);
  res.status(200).json(await timetableService.getOrCreateTimetable(query.sectionId, query.academicYearId));
}

export async function getTimetableHandler(req: Request, res: Response): Promise<void> {
  res.status(200).json(await timetableService.getTimetable(req.params.timetableId!));
}

export async function addTimetableEntryHandler(req: Request, res: Response): Promise<void> {
  const body = addEntrySchema.parse(req.body);
  const entry = await timetableService.addTimetableEntry(req.params.timetableId!, body, req.user!.id);
  res.status(201).json(entry);
}

export async function updateTimetableEntryHandler(req: Request, res: Response): Promise<void> {
  const body = updateEntrySchema.parse(req.body);
  const entry = await timetableService.updateTimetableEntry(req.params.entryId!, body, req.user!.id);
  res.status(200).json(entry);
}

export async function removeTimetableEntryHandler(req: Request, res: Response): Promise<void> {
  await timetableService.removeTimetableEntry(req.params.entryId!, req.user!.id);
  res.status(204).send();
}

export async function publishTimetableHandler(req: Request, res: Response): Promise<void> {
  res.status(200).json(await timetableService.publishTimetable(req.params.timetableId!, req.user!.id));
}
