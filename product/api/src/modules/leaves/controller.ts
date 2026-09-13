import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";
import { getActorProfile, resolveStudentScopeFilter, assertCampusInScope } from "../../lib/scope.js";
import { HttpError } from "../../middleware/errorHandler.js";
import * as teachersService from "../teachers/service.js";

const listQuerySchema = z.object({
  studentId: z.string().uuid().optional(),
  teacherId: z.string().uuid().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]).optional(),
  assignedToId: z.string().uuid().optional(),
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

  // Leave's other subject type — Teacher requesting their own leave.
  // "studentId"-style scoping doesn't apply here, so it's handled
  // separately rather than folded into resolveStudentScopeFilter.
  let teacherId = query.teacherId;
  if (profile.roles.includes("TEACHER") && !profile.roles.some((r) => ["SUPER_ADMIN", "CAMPUS_HEAD", "OFFICE"].includes(r))) {
    if (teacherId && teacherId !== profile.teacherId) {
      throw new HttpError(403, "OUT_OF_SCOPE", "You do not have access to this teacher's leave requests");
    }
    teacherId = profile.teacherId ?? undefined;
  } else if (teacherId && profile.campusIds.length > 0) {
    // CAMPUS_HEAD/OFFICE naming a specific teacherId — verify that teacher
    // actually holds their TEACHER role at one of the actor's own
    // campuses (previously unchecked — a real, if narrow, gap).
    const teacherCampusIds = await teachersService.getTeacherCampusIds(teacherId);
    if (!teacherCampusIds.some((id) => profile.campusIds.includes(id))) {
      throw new HttpError(403, "OUT_OF_SCOPE", "You do not have access to this teacher's leave requests");
    }
  }

  // CAMPUS_HEAD/OFFICE with no specific student/teacher named: "every leave
  // across my campus(es)" (both subject types) is well-defined for them —
  // handled as one OR'd campus filter in the service, since a mixed
  // STUDENT+TEACHER list can't use a single AND'd condition. A specific
  // studentId still goes through resolveStudentScopeFilter's existing
  // per-record campus check below; a specific teacherId's own campus
  // membership isn't independently re-verified here yet (pre-existing gap,
  // not introduced by this change — flagged in
  // docs/PHASE_11A_CAMPUS_SCOPING_IMPLEMENTATION_PLAN.md Group 5).
  if (profile.campusIds.length > 0 && !query.studentId && !teacherId) {
    res.status(200).json(
      await service.listLeaves({ status: query.status, assignedToId: query.assignedToId, campusIdIn: profile.campusIds })
    );
    return;
  }

  const studentScope = await resolveStudentScopeFilter(profile, query.studentId);
  res.status(200).json(
    await service.listLeaves({ teacherId, status: query.status, assignedToId: query.assignedToId, ...studentScope })
  );
}

export async function createLeaveHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  res.status(201).json(await service.createLeave(body, req.user!.id));
}

// Only enforces for a campus-assigned actor (CAMPUS_HEAD/OFFICE) — same
// reasoning as complaints/controller.ts's assertComplaintInScope:
// INCHARGE/TEACHER also hold leave.approve/leave.cancel but via a
// different (not-yet-wired-here) scope, so this must not newly block
// them with an empty campusIds array.
async function assertLeaveInScope(profile: Awaited<ReturnType<typeof getActorProfile>>, leaveId: string): Promise<void> {
  if (profile.campusIds.length === 0) return;
  const campusId = await service.getLeaveCampusId(leaveId);
  if (!campusId) throw new HttpError(403, "OUT_OF_SCOPE", "Cannot verify this leave request's campus");
  assertCampusInScope(profile, campusId);
}

export async function decideLeaveHandler(req: Request, res: Response): Promise<void> {
  const body = decideSchema.parse(req.body);
  const profile = await getActorProfile(req.user!.id);
  await assertLeaveInScope(profile, req.params.leaveId!);
  res.status(200).json(await service.decideLeave(req.params.leaveId!, body.decision, body.decisionNote, req.user!.id));
}

export async function cancelLeaveHandler(req: Request, res: Response): Promise<void> {
  const profile = await getActorProfile(req.user!.id);
  await assertLeaveInScope(profile, req.params.leaveId!);
  res.status(200).json(await service.cancelLeave(req.params.leaveId!, req.user!.id));
}

export async function forwardLeaveHandler(req: Request, res: Response): Promise<void> {
  const profile = await getActorProfile(req.user!.id);
  await assertLeaveInScope(profile, req.params.leaveId!);
  res.status(200).json(await service.forwardLeave(req.params.leaveId!, req.user!.id));
}
