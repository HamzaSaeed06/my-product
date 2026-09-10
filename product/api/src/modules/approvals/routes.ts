import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const approvalsRouter = Router();

approvalsRouter.get(
  "/",
  ...requirePermission("approval.view"),
  asyncHandler(controller.listApprovalsHandler)
);

approvalsRouter.post(
  "/:approvalId/decide",
  ...requirePermission("approval.decide"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.decideApprovalHandler)
);
