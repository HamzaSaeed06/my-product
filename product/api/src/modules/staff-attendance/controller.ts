import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";
import { getActorProfile, assertCampusInScope, type ActorProfile } from "../../lib/scope.js";

// Same documented limitation as admission-inquiries/leaves/complaints:
// INCHARGE shares staff_attendance.mark per spec but has no UserRole-based
// campusId, only a class/section-level InchargeScope that doesn't map onto
// "which campus" — left unscoped for INCHARGE rather than newly blocked.
function assertOwnCampus(profile: ActorProfile, campusId: string): void {
  if (profile.campusIds.length === 0) return;
  assertCampusInScope(profile, campusId);
}

const checkInSchema = z.object({
  campusId: z.string().uuid(),
  token: z.string().min(1),
  geoLat: z.number().optional(),
  geoLng: z.number().optional(),
});

const markSchema = z.object({
  targetUserId: z.string().uuid(),
  campusId: z.string().uuid(),
});

const listQuerySchema = z.object({
  campusId: z.string().uuid().optional(),
  date: z.string().date().optional(),
  userId: z.string().uuid().optional(),
});

export async function getQrDisplayTokenHandler(req: Request, res: Response): Promise<void> {
  const campusId = z.string().uuid().parse(req.query.campusId);
  const profile = await getActorProfile(req.user!.id);
  assertOwnCampus(profile, campusId);
  res.status(200).json(service.getQrDisplayToken(campusId));
}

export async function checkInHandler(req: Request, res: Response): Promise<void> {
  const body = checkInSchema.parse(req.body);
  const attendance = await service.checkInViaQr({ ...body, ipAddress: req.ip }, req.user!.id);
  res.status(201).json(attendance);
}

export async function markStaffAttendanceHandler(req: Request, res: Response): Promise<void> {
  const body = markSchema.parse(req.body);
  const profile = await getActorProfile(req.user!.id);
  assertOwnCampus(profile, body.campusId);
  res.status(201).json(await service.markStaffAttendance(body, req.user!.id));
}

export async function grantRemoteApprovedHandler(req: Request, res: Response): Promise<void> {
  const body = markSchema.parse(req.body);
  const profile = await getActorProfile(req.user!.id);
  assertCampusInScope(profile, body.campusId);
  res.status(201).json(await service.grantRemoteApproved(body, req.user!.id));
}

export async function listStaffAttendanceHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  const profile = await getActorProfile(req.user!.id);
  if (query.campusId) {
    assertOwnCampus(profile, query.campusId);
    res.status(200).json(await service.listStaffAttendance(query));
    return;
  }
  const campusIdIn = profile.campusIds.length > 0 ? profile.campusIds : undefined;
  res.status(200).json(await service.listStaffAttendance({ ...query, campusIdIn }));
}

export async function listMyStaffAttendanceHandler(req: Request, res: Response): Promise<void> {
  res.status(200).json(await service.listStaffAttendance({ userId: req.user!.id }));
}
