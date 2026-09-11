import type { Request, Response } from "express";
import { z } from "zod";
import * as assignmentsService from "./service.js";

const listQuerySchema = z.object({
  teacherId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  academicYearId: z.string().uuid().optional(),
});

const createSchema = z.object({
  teacherId: z.string().uuid(),
  subjectId: z.string().uuid(),
  classId: z.string().uuid(),
  sectionId: z.string().uuid(),
  academicYearId: z.string().uuid(),
});

export async function listTeacherAssignmentsHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  res.status(200).json(await assignmentsService.listTeacherAssignments(query));
}

export async function createTeacherAssignmentHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  const assignment = await assignmentsService.createTeacherAssignment(body, req.user!.id);
  res.status(201).json(assignment);
}

export async function archiveTeacherAssignmentHandler(req: Request, res: Response): Promise<void> {
  const assignment = await assignmentsService.archiveTeacherAssignment(req.params.assignmentId!, req.user!.id);
  res.status(200).json(assignment);
}
