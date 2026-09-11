import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const studentFeesRouter = Router();

studentFeesRouter.get("/", ...requirePermission("fee_assignment.view"), asyncHandler(controller.listStudentFeesHandler));

studentFeesRouter.post(
  "/",
  ...requirePermission("fee_assignment.create"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.assignStudentFeeHandler)
);

studentFeesRouter.post(
  "/:studentFeeId/archive",
  ...requirePermission("fee_assignment.edit"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.archiveStudentFeeHandler)
);
