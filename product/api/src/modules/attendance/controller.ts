import type { Request, Response } from "express";
import { z } from "zod";
import * as attendanceService from "./service.js";
import { getActorProfile, assertSectionInScope, resolveStudentScopeFilter, assertCampusInScope } from "../../lib/scope.js";
import { getApprovalRequestCampusId } from "../approvals/service.js";
import { HttpError } from "../../middleware/errorHandler.js";

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
  // Real, pre-existing gap found while wiring campus scoping (not
  // campus-specific to this pass): only listAttendanceHandler verified
  // sectionId was in scope — a Campus Head/Office could previously mark
  // attendance for any section in any campus just by knowing its id.
  const profile = await getActorProfile(req.user!.id);
  await assertSectionInScope(profile, body.sectionId);
  const result = await attendanceService.markAttendance(body, req.user!.id);
  res.status(201).json(result);
}

export async function listAttendanceHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  const profile = await getActorProfile(req.user!.id);
  if (query.sectionId) await assertSectionInScope(profile, query.sectionId);
  const studentScope = await resolveStudentScopeFilter(profile, query.studentId);
  res.status(200).json(
    await attendanceService.listAttendance({ sectionId: query.sectionId, date: query.date, ...studentScope })
  );
}

export async function requestAttendanceCorrectionHandler(req: Request, res: Response): Promise<void> {
  const body = correctionSchema.parse(req.body);
  const profile = await getActorProfile(req.user!.id);
  await assertSectionInScope(profile, await attendanceService.getAttendanceSectionId(req.params.attendanceId!));
  const request = await attendanceService.requestAttendanceCorrection(req.params.attendanceId!, body, req.user!.id);
  res.status(201).json(request);
}

export async function decideAttendanceCorrectionHandler(req: Request, res: Response): Promise<void> {
  const body = decideSchema.parse(req.body);
  const profile = await getActorProfile(req.user!.id);
  if (profile.campusIds.length > 0) {
    const campusId = await getApprovalRequestCampusId(req.params.approvalId!);
    if (!campusId) throw new HttpError(403, "OUT_OF_SCOPE", "Cannot verify this request's campus");
    assertCampusInScope(profile, campusId);
  }
  const result = await attendanceService.decideAttendanceCorrection(
    req.params.approvalId!,
    body.decision,
    body.decisionNote,
    req.user!.id
  );
  res.status(200).json(result);
}
