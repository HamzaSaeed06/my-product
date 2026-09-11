import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";
import { getActorProfile, resolveStudentScopeFilter } from "../../lib/scope.js";
import { HttpError } from "../../middleware/errorHandler.js";

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
  const profile = await getActorProfile(req.user!.id);
  const studentScope = await resolveStudentScopeFilter(profile, query.studentId);

  // Leave's other subject type — Teacher requesting their own leave.
  // "studentId"-style scoping doesn't apply here, so it's handled
  // separately rather than folded into resolveStudentScopeFilter.
  let teacherId = query.teacherId;
  if (profile.roles.includes("TEACHER") && !profile.roles.some((r) => ["SUPER_ADMIN", "PRINCIPAL", "OFFICE"].includes(r))) {
    if (teacherId && teacherId !== profile.teacherId) {
      throw new HttpError(403, "OUT_OF_SCOPE", "You do not have access to this teacher's leave requests");
    }
    teacherId = profile.teacherId ?? undefined;
  }

  res.status(200).json(await service.listLeaves({ teacherId, status: query.status, ...studentScope }));
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
