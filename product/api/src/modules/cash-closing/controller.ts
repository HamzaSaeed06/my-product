import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";

const amountSchema = z.string().regex(/^-?\d+(\.\d{1,2})?$/, "must be a decimal number with up to 2 places");
const listQuerySchema = z.object({ campusId: z.string().uuid().optional() });

const createSchema = z.object({
  campusId: z.string().uuid(),
  date: z.coerce.date(),
  openingBalance: amountSchema,
  collections: amountSchema,
  refundsPaidOut: amountSchema,
  actualBalance: amountSchema,
});

export async function listCashClosingsHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  res.status(200).json(await service.listCashClosings(query));
}

export async function createCashClosingHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  res.status(201).json(await service.createCashClosing(body, req.user!.id));
}

export async function approveCashClosingHandler(req: Request, res: Response): Promise<void> {
  res.status(200).json(await service.approveCashClosing(req.params.closingId!, req.user!.id));
}
