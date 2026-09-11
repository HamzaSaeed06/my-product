import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "./errorHandler.js";

// A customer deployment has no provider-staff session cookie — it
// authenticates with the bearer token issued once at Deployment creation
// (spec §2 "Heartbeat Payload": `Authorization: Bearer <signed-heartbeat-
// token>`). Attaches the resolved Deployment to the request so the
// controller doesn't need a second lookup.
export async function authenticateHeartbeat(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : undefined;

  if (!token) {
    next(new HttpError(401, "UNAUTHENTICATED", "Missing bearer heartbeat token"));
    return;
  }

  const deployment = await prisma.deployment.findUnique({ where: { heartbeatToken: token } });
  if (!deployment) {
    next(new HttpError(401, "INVALID_HEARTBEAT_TOKEN", "Unknown or invalid heartbeat token"));
    return;
  }

  req.heartbeatDeployment = deployment;
  next();
}
