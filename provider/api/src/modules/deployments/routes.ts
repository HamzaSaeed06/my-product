import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireRole } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const deploymentsRouter = Router();

deploymentsRouter.get(
  "/",
  ...requireRole("ADMIN", "SUPPORT_READ_ONLY"),
  asyncHandler(controller.listDeploymentsHandler)
);
deploymentsRouter.get(
  "/:deploymentId",
  ...requireRole("ADMIN", "SUPPORT_READ_ONLY"),
  asyncHandler(controller.getDeploymentHandler)
);
deploymentsRouter.post(
  "/",
  ...requireRole("ADMIN"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.createDeploymentHandler)
);
deploymentsRouter.post(
  "/:deploymentId/status",
  ...requireRole("ADMIN"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.setDeploymentStatusHandler)
);
