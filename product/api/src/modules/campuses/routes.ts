import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const campusesRouter = Router();

campusesRouter.get("/", ...requirePermission("campus.view"), asyncHandler(controller.listCampusesHandler));

campusesRouter.post(
  "/",
  ...requirePermission("campus.create"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.createCampusHandler)
);

campusesRouter.patch(
  "/:campusId",
  ...requirePermission("campus.edit"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.updateCampusHandler)
);

campusesRouter.post(
  "/:campusId/archive",
  ...requirePermission("campus.archive"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.archiveCampusHandler)
);
