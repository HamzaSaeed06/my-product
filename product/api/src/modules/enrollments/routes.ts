import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const enrollmentsRouter = Router();

enrollmentsRouter.get("/", ...requirePermission("enrollment.view"), asyncHandler(controller.listEnrollmentsHandler));

enrollmentsRouter.post(
  "/",
  ...requirePermission("enrollment.create"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.createEnrollmentHandler)
);

enrollmentsRouter.post(
  "/:enrollmentId/transfer",
  ...requirePermission("enrollment.transfer"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.transferEnrollmentHandler)
);

enrollmentsRouter.post(
  "/:enrollmentId/withdraw",
  ...requirePermission("enrollment.withdraw"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.withdrawEnrollmentHandler)
);
