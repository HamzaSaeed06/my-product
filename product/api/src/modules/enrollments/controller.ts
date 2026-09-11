import type { Request, Response } from "express";
import { z } from "zod";
import * as enrollmentsService from "./service.js";
import { getActorProfile, assertSectionInScope, resolveStudentScopeFilter } from "../../lib/scope.js";

const listQuerySchema = z.object({
  studentId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  academicYearId: z.string().uuid().optional(),
});

const createSchema = z.object({
  studentId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  classId: z.string().uuid(),
  sectionId: z.string().uuid(),
  rollNumber: z.string().max(30).optional(),
});

const transferSchema = z.object({
  classId: z.string().uuid(),
  sectionId: z.string().uuid(),
  rollNumber: z.string().max(30).optional(),
});

export async function listEnrollmentsHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  const profile = await getActorProfile(req.user!.id);
  if (query.sectionId) await assertSectionInScope(profile, query.sectionId);
  const studentScope = await resolveStudentScopeFilter(profile, query.studentId);
  res.status(200).json(
    await enrollmentsService.listEnrollments({ sectionId: query.sectionId, academicYearId: query.academicYearId, ...studentScope })
  );
}

export async function createEnrollmentHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  const enrollment = await enrollmentsService.createEnrollment(body, req.user!.id);
  res.status(201).json(enrollment);
}

export async function transferEnrollmentHandler(req: Request, res: Response): Promise<void> {
  const body = transferSchema.parse(req.body);
  const enrollment = await enrollmentsService.transferEnrollment(req.params.enrollmentId!, body, req.user!.id);
  res.status(201).json(enrollment);
}

export async function withdrawEnrollmentHandler(req: Request, res: Response): Promise<void> {
  const enrollment = await enrollmentsService.withdrawEnrollment(req.params.enrollmentId!, req.user!.id);
  res.status(200).json(enrollment);
}
