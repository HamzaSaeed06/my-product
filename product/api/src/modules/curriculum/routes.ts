import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const curriculumRouter = Router();

curriculumRouter.get("/", ...requirePermission("curriculum.view"), asyncHandler(controller.listCurriculumHandler));

curriculumRouter.post(
  "/",
  ...requirePermission("curriculum.create"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.createCurriculumTopicHandler)
);

curriculumRouter.patch(
  "/:curriculumId",
  ...requirePermission("curriculum.edit"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.updateCurriculumTopicHandler)
);

curriculumRouter.post(
  "/:curriculumId/archive",
  ...requirePermission("curriculum.edit"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.archiveCurriculumTopicHandler)
);

curriculumRouter.post(
  "/:curriculumId/progress/:sectionId",
  ...requirePermission("curriculum.edit"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.markCurriculumProgressHandler)
);
