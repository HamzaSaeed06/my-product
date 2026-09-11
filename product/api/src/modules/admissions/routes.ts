import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const admissionsRouter = Router();

admissionsRouter.get("/", ...requirePermission("admission.view"), asyncHandler(controller.listAdmissionsHandler));

admissionsRouter.post(
  "/",
  ...requirePermission("admission.create"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.createAdmissionHandler)
);

admissionsRouter.post(
  "/:admissionId/approve",
  ...requirePermission("admission.approve"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.approveAdmissionHandler)
);

admissionsRouter.post(
  "/:admissionId/reject",
  ...requirePermission("admission.reject"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.rejectAdmissionHandler)
);

admissionsRouter.post(
  "/:admissionId/withdraw",
  ...requirePermission("admission.create"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.withdrawAdmissionHandler)
);
