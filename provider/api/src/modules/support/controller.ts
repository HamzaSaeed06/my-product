import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";

const listQuerySchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  customerId: z.string().uuid().optional(),
});

const createSchema = z.object({
  customerId: z.string().uuid(),
  subject: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
});

const assignSchema = z.object({ assignedToId: z.string().uuid().nullable() });

export async function listTicketsHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  res.status(200).json(await service.listTickets(query));
}

export async function createTicketHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  res.status(201).json(await service.createTicket(body, req.providerUser!.id));
}

export async function assignTicketHandler(req: Request, res: Response): Promise<void> {
  const body = assignSchema.parse(req.body);
  res.status(200).json(await service.assignTicket(req.params.ticketId!, body.assignedToId, req.providerUser!.id));
}

export async function resolveTicketHandler(req: Request, res: Response): Promise<void> {
  res.status(200).json(await service.resolveTicket(req.params.ticketId!, req.providerUser!.id));
}

export async function closeTicketHandler(req: Request, res: Response): Promise<void> {
  res.status(200).json(await service.closeTicket(req.params.ticketId!, req.providerUser!.id));
}
