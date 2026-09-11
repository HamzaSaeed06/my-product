import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";

const amountSchema = z.string().regex(/^\d+(\.\d{1,2})?$/, "amount must be a decimal number with up to 2 places");

const listQuerySchema = z.object({
  invoiceId: z.string().uuid().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
});

const createSchema = z.object({ invoiceId: z.string().uuid(), amount: amountSchema, reason: z.string().min(1) });
const decideSchema = z.object({ decision: z.enum(["APPROVED", "REJECTED"]) });

export async function listWaiversHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  res.status(200).json(await service.listWaivers(query));
}

export async function createWaiverHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  res.status(201).json(await service.createWaiver(body, req.user!.id));
}

export async function decideWaiverHandler(req: Request, res: Response): Promise<void> {
  const body = decideSchema.parse(req.body);
  res.status(200).json(await service.decideWaiver(req.params.waiverId!, body.decision, req.user!.id));
}
