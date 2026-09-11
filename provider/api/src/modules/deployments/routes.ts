import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { authenticate } from "../../middleware/authenticate.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const deploymentsRouter = Router();

deploymentsRouter.get("/", authenticate, asyncHandler(controller.listDeploymentsHandler));
deploymentsRouter.get("/:deploymentId", authenticate, asyncHandler(controller.getDeploymentHandler));
deploymentsRouter.post("/", authenticate, csrfProtection, writeRateLimiter, asyncHandler(controller.createDeploymentHandler));
deploymentsRouter.post(
  "/:deploymentId/status",
  authenticate,
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.setDeploymentStatusHandler)
);
