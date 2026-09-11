import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";

const listQuerySchema = z.object({
  studentId: z.string().uuid().optional(),
  assignedToId: z.string().uuid().optional(),
  status: z.enum(["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED", "REOPENED"]).optional(),
});

const createSchema = z.object({
  studentId: z.string().uuid().optional(),
  category: z.string().min(1),
  description: z.string().min(1),
});

const assignSchema = z.object({ assignedToId: z.string().uuid() });
const noteSchema = z.object({ note: z.string().min(1) });
const resolveSchema = z.object({ resolutionNote: z.string().min(1) });
const reopenSchema = z.object({ reason: z.string().min(1) });

export async function listComplaintsHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  res.status(200).json(await service.listComplaints(query));
}

export async function getComplaintHandler(req: Request, res: Response): Promise<void> {
  res.status(200).json(await service.getComplaint(req.params.complaintId!));
}

export async function createComplaintHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  res.status(201).json(await service.createComplaint(body, req.user!.id));
}

export async function assignComplaintHandler(req: Request, res: Response): Promise<void> {
  const body = assignSchema.parse(req.body);
  res.status(200).json(await service.assignComplaint(req.params.complaintId!, body.assignedToId, req.user!.id));
}

export async function startComplaintProgressHandler(req: Request, res: Response): Promise<void> {
  res.status(200).json(await service.startComplaintProgress(req.params.complaintId!, req.user!.id));
}

export async function addComplaintNoteHandler(req: Request, res: Response): Promise<void> {
  const body = noteSchema.parse(req.body);
  res.status(201).json(await service.addComplaintNote(req.params.complaintId!, body.note, req.user!.id));
}

export async function resolveComplaintHandler(req: Request, res: Response): Promise<void> {
  const body = resolveSchema.parse(req.body);
  res.status(200).json(await service.resolveComplaint(req.params.complaintId!, body.resolutionNote, req.user!.id));
}

export async function closeComplaintHandler(req: Request, res: Response): Promise<void> {
  res.status(200).json(await service.closeComplaint(req.params.complaintId!, req.user!.id));
}

export async function reopenComplaintHandler(req: Request, res: Response): Promise<void> {
  const body = reopenSchema.parse(req.body);
  res.status(200).json(await service.reopenComplaint(req.params.complaintId!, body.reason, req.user!.id));
}
