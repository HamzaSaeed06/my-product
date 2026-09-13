import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";
import { getActorProfile, assertCampusInScope, type ActorProfile } from "../../lib/scope.js";

// Only enforced for a campus-assigned actor (CAMPUS_HEAD/OFFICE) — same
// pattern as complaints/leaves/approvals: INCHARGE also holds
// admission_inquiry.* (per Phase 11 Phase C's spec) but has no UserRole-
// based campusId, only an InchargeScope (class/section, not campus-level),
// which doesn't map cleanly onto "which campus's inquiries." Left
// unscoped for INCHARGE for now rather than newly blocked — a documented,
// known limitation, not a silent gap.
function assertInquiryCampus(profile: ActorProfile, campusId: string): void {
  if (profile.campusIds.length === 0) return;
  assertCampusInScope(profile, campusId);
}

const listQuerySchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "CONVERTED", "CLOSED"]).optional(),
  campusId: z.string().uuid().optional(),
});

const createSchema = z.object({
  campusId: z.string().uuid(),
  classId: z.string().uuid().optional(),
  childName: z.string().min(1).max(200),
  parentName: z.string().min(1).max(200),
  parentPhone: z.string().min(1).max(50),
  parentEmail: z.string().email().optional(),
  source: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});

const updateSchema = z.object({
  classId: z.string().uuid().optional(),
  parentEmail: z.string().email().optional(),
  notes: z.string().max(2000).optional(),
  status: z.enum(["CONTACTED", "CLOSED"]).optional(),
});

const convertSchema = z.object({
  classId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  existingStudentId: z.string().uuid().optional(),
  studentNationalId: z.string().min(1).max(50).optional(),
  studentDateOfBirth: z.coerce.date().optional(),
  studentGender: z.string().max(30).optional(),
  existingParentId: z.string().uuid().optional(),
  parentNationalId: z.string().min(1).max(50).optional(),
});

export async function listAdmissionInquiriesHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  const profile = await getActorProfile(req.user!.id);
  if (query.campusId) assertInquiryCampus(profile, query.campusId);
  const campusIdIn = !query.campusId && profile.campusIds.length > 0 ? profile.campusIds : undefined;
  res.status(200).json(await service.listAdmissionInquiries({ status: query.status, campusId: query.campusId, campusIdIn }));
}

export async function getAdmissionInquiryHandler(req: Request, res: Response): Promise<void> {
  const profile = await getActorProfile(req.user!.id);
  assertInquiryCampus(profile, await service.getAdmissionInquiryCampusId(req.params.inquiryId!));
  res.status(200).json(await service.getAdmissionInquiry(req.params.inquiryId!));
}

export async function createAdmissionInquiryHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  const profile = await getActorProfile(req.user!.id);
  assertInquiryCampus(profile, body.campusId);
  res.status(201).json(await service.createAdmissionInquiry(body, req.user!.id));
}

export async function updateAdmissionInquiryHandler(req: Request, res: Response): Promise<void> {
  const body = updateSchema.parse(req.body);
  const profile = await getActorProfile(req.user!.id);
  assertInquiryCampus(profile, await service.getAdmissionInquiryCampusId(req.params.inquiryId!));
  res.status(200).json(await service.updateAdmissionInquiry(req.params.inquiryId!, body, req.user!.id));
}

export async function convertAdmissionInquiryHandler(req: Request, res: Response): Promise<void> {
  const body = convertSchema.parse(req.body);
  const profile = await getActorProfile(req.user!.id);
  assertInquiryCampus(profile, await service.getAdmissionInquiryCampusId(req.params.inquiryId!));
  res.status(201).json(await service.convertAdmissionInquiry(req.params.inquiryId!, body, req.user!.id));
}
