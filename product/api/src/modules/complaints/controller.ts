import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";
import { getActorProfile, resolveStudentScopeFilter, assertStudentInScope, assertCampusInScope } from "../../lib/scope.js";

const listQuerySchema = z.object({
  studentId: z.string().uuid().optional(),
  assignedToId: z.string().uuid().optional(),
  status: z.enum(["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED", "REOPENED"]).optional(),
});

const createSchema = z.object({
  studentId: z.string().uuid().optional(),
  // Only meaningful when studentId is omitted — a student-linked complaint
  // always derives its campus from the student's active enrollment, so an
  // explicit campusId there would just be ignored, not validated against.
  campusId: z.string().uuid().optional(),
  category: z.string().min(1),
  description: z.string().min(1),
});

const assignSchema = z.object({ assignedToId: z.string().uuid() });
const noteSchema = z.object({ note: z.string().min(1) });
const resolveSchema = z.object({ resolutionNote: z.string().min(1) });
const reopenSchema = z.object({ reason: z.string().min(1) });

export async function listComplaintsHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  const profile = await getActorProfile(req.user!.id);

  // CAMPUS_HEAD/OFFICE: Complaint has a direct campusId, so "every complaint
  // at my campus(es)" is a plain filter — correctly includes campus-less
  // (no-student) complaints too, unlike resolveStudentScopeFilter's
  // enrollment-based join which only STUDENT/PARENT/a specific studentId
  // actually need.
  if (profile.campusIds.length > 0 && !query.studentId) {
    res.status(200).json(
      await service.listComplaints({ assignedToId: query.assignedToId, status: query.status, campusIdIn: profile.campusIds })
    );
    return;
  }

  const studentScope = await resolveStudentScopeFilter(profile, query.studentId);
  res.status(200).json(
    await service.listComplaints({ assignedToId: query.assignedToId, status: query.status, ...studentScope })
  );
}

export async function getComplaintHandler(req: Request, res: Response): Promise<void> {
  const complaint = await service.getComplaint(req.params.complaintId!);
  const profile = await getActorProfile(req.user!.id);
  if (complaint.studentId) {
    await assertStudentInScope(profile, complaint.studentId);
  } else if (profile.campusIds.length > 0) {
    // Campus-less complaint (no student) — its only anchor is campusId,
    // so that's what gates a campus-assigned actor (CAMPUS_HEAD/OFFICE).
    // Previously nothing checked this case at all for them. INCHARGE/
    // TEACHER have no campusIds and are left as before (ungated) rather
    // than newly blocked.
    assertCampusInScope(profile, complaint.campusId);
  }
  res.status(200).json(complaint);
}

export async function createComplaintHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  const profile = await getActorProfile(req.user!.id);
  if (body.studentId) {
    await assertStudentInScope(profile, body.studentId);
  } else if (body.campusId) {
    assertCampusInScope(profile, body.campusId);
  }
  res.status(201).json(await service.createComplaint(body, req.user!.id));
}

// Only enforces for a campus-assigned actor (CAMPUS_HEAD/OFFICE) — INCHARGE
// also holds complaint.assign but is scoped via InchargeScope (class/
// section), a different mechanism not wired into Complaint yet. Skipping
// the check for INCHARGE/TEACHER here preserves their pre-existing
// (ungated) behavior rather than newly blocking them with an empty
// campusIds array, which would be a regression, not a fix.
async function assertComplaintInScope(req: Request): Promise<void> {
  const profile = await getActorProfile(req.user!.id);
  if (profile.campusIds.length === 0) return;
  assertCampusInScope(profile, await service.getComplaintCampusId(req.params.complaintId!));
}

export async function assignComplaintHandler(req: Request, res: Response): Promise<void> {
  const body = assignSchema.parse(req.body);
  await assertComplaintInScope(req);
  res.status(200).json(await service.assignComplaint(req.params.complaintId!, body.assignedToId, req.user!.id));
}

export async function forwardComplaintHandler(req: Request, res: Response): Promise<void> {
  await assertComplaintInScope(req);
  res.status(200).json(await service.forwardComplaint(req.params.complaintId!, req.user!.id));
}

export async function startComplaintProgressHandler(req: Request, res: Response): Promise<void> {
  await assertComplaintInScope(req);
  res.status(200).json(await service.startComplaintProgress(req.params.complaintId!, req.user!.id));
}

export async function addComplaintNoteHandler(req: Request, res: Response): Promise<void> {
  const body = noteSchema.parse(req.body);
  await assertComplaintInScope(req);
  res.status(201).json(await service.addComplaintNote(req.params.complaintId!, body.note, req.user!.id));
}

export async function resolveComplaintHandler(req: Request, res: Response): Promise<void> {
  const body = resolveSchema.parse(req.body);
  await assertComplaintInScope(req);
  res.status(200).json(await service.resolveComplaint(req.params.complaintId!, body.resolutionNote, req.user!.id));
}

export async function closeComplaintHandler(req: Request, res: Response): Promise<void> {
  await assertComplaintInScope(req);
  res.status(200).json(await service.closeComplaint(req.params.complaintId!, req.user!.id));
}

export async function reopenComplaintHandler(req: Request, res: Response): Promise<void> {
  const body = reopenSchema.parse(req.body);
  await assertComplaintInScope(req);
  res.status(200).json(await service.reopenComplaint(req.params.complaintId!, body.reason, req.user!.id));
}
