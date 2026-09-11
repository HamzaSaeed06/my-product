import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";

const createSchema = z.object({
  provider: z.enum(["EASYPAISA", "JAZZCASH", "SIMULATED"]),
  name: z.string().min(1),
});

const activeSchema = z.object({ isActive: z.boolean() });

export async function listPaymentGatewaysHandler(req: Request, res: Response): Promise<void> {
  res.status(200).json(await service.listPaymentGateways());
}

export async function createPaymentGatewayHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  res.status(201).json(await service.createPaymentGateway(body, req.user!.id));
}

export async function setPaymentGatewayActiveHandler(req: Request, res: Response): Promise<void> {
  const body = activeSchema.parse(req.body);
  res.status(200).json(await service.setPaymentGatewayActive(req.params.gatewayId!, body.isActive, req.user!.id));
}
