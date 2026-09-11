import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";

const listQuerySchema = z.object({ customerId: z.string().uuid().optional() });

const createSchema = z.object({
  customerId: z.string().uuid(),
  version: z.string().min(1).max(50),
  url: z.string().url(),
});

const statusSchema = z.object({ status: z.enum(["PROVISIONING", "ACTIVE", "SUSPENDED", "DECOMMISSIONED"]) });

export async function listDeploymentsHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  res.status(200).json(await service.listDeployments(query));
}

export async function getDeploymentHandler(req: Request, res: Response): Promise<void> {
  res.status(200).json(await service.getDeployment(req.params.deploymentId!));
}

export async function createDeploymentHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  res.status(201).json(await service.createDeployment(body, req.providerUser!.id));
}

export async function setDeploymentStatusHandler(req: Request, res: Response): Promise<void> {
  const body = statusSchema.parse(req.body);
  res.status(200).json(await service.setDeploymentStatus(req.params.deploymentId!, body.status, req.providerUser!.id));
}
