import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { authenticateHeartbeat } from "../../middleware/authenticateHeartbeat.js";
import { heartbeatRateLimiter } from "../../middleware/rateLimiter.js";

// Public (no provider-staff session, no CSRF) — a customer deployment has
// neither. Authenticated purely by its heartbeatToken bearer, per spec's
// "passive, async, non-blocking" heartbeat mechanism.
export const heartbeatRouter = Router();

heartbeatRouter.post("/", heartbeatRateLimiter, authenticateHeartbeat, asyncHandler(controller.heartbeatHandler));
