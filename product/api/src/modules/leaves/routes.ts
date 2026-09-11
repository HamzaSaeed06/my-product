import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const leavesRouter = Router();

leavesRouter.get("/", ...requirePermission("leave.view"), asyncHandler(controller.listLeavesHandler));

leavesRouter.post(
  "/",
  ...requirePermission("leave.create"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.createLeaveHandler)
);

leavesRouter.post(
  "/:leaveId/decide",
  ...requirePermission("leave.approve"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.decideLeaveHandler)
);

leavesRouter.post(
  "/:leaveId/cancel",
  ...requirePermission("leave.cancel"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.cancelLeaveHandler)
);
