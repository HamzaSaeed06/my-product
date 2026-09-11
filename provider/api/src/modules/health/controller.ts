import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";
import { HttpError } from "../../middleware/errorHandler.js";

const heartbeatSchema = z.object({
  deploymentId: z.string(),
  licenseId: z.string().optional(),
  customerId: z.string().optional(),
  version: z.string().min(1),
  timestamp: z.string().optional(),
  metrics: z.object({
    uptime: z.number().nonnegative(),
    studentCount: z.number().int().nonnegative(),
    staffCount: z.number().int().nonnegative(),
    campusCount: z.number().int().nonnegative(),
    storageUsed: z.number().nonnegative(),
    apiStatus: z.enum(["healthy", "degraded", "down"]),
    dbStatus: z.enum(["healthy", "degraded", "down"]),
    avgResponseTime: z.number().nonnegative(),
    errorRate: z.number().min(0).max(100),
  }),
});

export async function heartbeatHandler(req: Request, res: Response): Promise<void> {
  const body = heartbeatSchema.parse(req.body);
  const deployment = req.heartbeatDeployment!;

  // The bearer token already resolved which deployment this is — the
  // payload's own deploymentId must match it (defense against a stale/
  // copy-pasted payload sent with the wrong token).
  if (body.deploymentId !== deployment.id) {
    throw new HttpError(400, "DEPLOYMENT_ID_MISMATCH", "Payload deploymentId does not match the authenticated deployment");
  }

  const result = await service.recordHeartbeat(deployment.id, { deploymentId: body.deploymentId, version: body.version, metrics: body.metrics });

  res.status(200).json({
    success: true,
    license: { valid: result.valid, expiresIn: result.expiresIn, message: result.message },
  });
}
