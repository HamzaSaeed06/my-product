import type { Request, Response } from "express";
import { z } from "zod";
import * as teachersService from "./service.js";

const createSchema = z.object({
  userId: z.string().uuid(),
  employeeCode: z.string().max(50).optional(),
  qualification: z.string().max(200).optional(),
  joiningDate: z.coerce.date().optional(),
  phone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
});

const updateSchema = createSchema.omit({ userId: true }).partial();

export async function listTeachersHandler(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await teachersService.listTeachers());
}

export async function createTeacherHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  const teacher = await teachersService.createTeacher(body, req.user!.id);
  res.status(201).json(teacher);
}

export async function updateTeacherHandler(req: Request, res: Response): Promise<void> {
  const body = updateSchema.parse(req.body);
  const teacher = await teachersService.updateTeacher(req.params.teacherId!, body, req.user!.id);
  res.status(200).json(teacher);
}

export async function archiveTeacherHandler(req: Request, res: Response): Promise<void> {
  const teacher = await teachersService.archiveTeacher(req.params.teacherId!, req.user!.id);
  res.status(200).json(teacher);
}
