import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const classesRouter = Router();

classesRouter.get("/", ...requirePermission("class.view"), asyncHandler(controller.listClassesHandler));

classesRouter.post(
  "/",
  ...requirePermission("class.create"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.createClassHandler)
);

classesRouter.patch(
  "/:classId",
  ...requirePermission("class.edit"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.updateClassHandler)
);

classesRouter.post(
  "/:classId/archive",
  ...requirePermission("class.archive"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.archiveClassHandler)
);
