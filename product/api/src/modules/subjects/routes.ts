import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const subjectsRouter = Router();

subjectsRouter.get("/", ...requirePermission("subject.view"), asyncHandler(controller.listSubjectsHandler));

subjectsRouter.post(
  "/",
  ...requirePermission("subject.create"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.createSubjectHandler)
);

subjectsRouter.patch(
  "/:subjectId",
  ...requirePermission("subject.edit"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.updateSubjectHandler)
);

subjectsRouter.post(
  "/:subjectId/archive",
  ...requirePermission("subject.archive"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.archiveSubjectHandler)
);
