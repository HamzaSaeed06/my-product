import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const academicYearsRouter = Router();

academicYearsRouter.get(
  "/",
  ...requirePermission("academic_year.view"),
  asyncHandler(controller.listAcademicYearsHandler)
);

academicYearsRouter.post(
  "/",
  ...requirePermission("academic_year.create"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.createAcademicYearHandler)
);

academicYearsRouter.patch(
  "/:academicYearId",
  ...requirePermission("academic_year.edit"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.updateAcademicYearHandler)
);

academicYearsRouter.post(
  "/:academicYearId/close",
  ...requirePermission("academic_year.close"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.closeAcademicYearHandler)
);
