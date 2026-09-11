import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";

const listQuerySchema = z.object({ status: z.enum(["ACTIVE", "INACTIVE"]).optional() });

const createSchema = z.object({
  name: z.string().min(1).max(200),
  contactName: z.string().min(1).max(200),
  contactEmail: z.string().email(),
  contactPhone: z.string().max(50).optional(),
  notes: z.string().max(2000).optional(),
});

const updateSchema = createSchema.partial();

const statusSchema = z.object({ status: z.enum(["ACTIVE", "INACTIVE"]) });

export async function listCustomersHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  res.status(200).json(await service.listCustomers(query));
}

export async function getCustomerHandler(req: Request, res: Response): Promise<void> {
  res.status(200).json(await service.getCustomer(req.params.customerId!));
}

export async function createCustomerHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  res.status(201).json(await service.createCustomer(body, req.providerUser!.id));
}

export async function updateCustomerHandler(req: Request, res: Response): Promise<void> {
  const body = updateSchema.parse(req.body);
  res.status(200).json(await service.updateCustomer(req.params.customerId!, body, req.providerUser!.id));
}

export async function setCustomerStatusHandler(req: Request, res: Response): Promise<void> {
  const body = statusSchema.parse(req.body);
  res.status(200).json(await service.setCustomerStatus(req.params.customerId!, body.status, req.providerUser!.id));
}
