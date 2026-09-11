import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const assessmentsRouter = Router();

assessmentsRouter.get("/", ...requirePermission("assessment.view"), asyncHandler(controller.listAssessmentsHandler));
assessmentsRouter.get("/:assessmentId", ...requirePermission("assessment.view"), asyncHandler(controller.getAssessmentHandler));

assessmentsRouter.post(
  "/",
  ...requirePermission("assessment.create"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.createAssessmentHandler)
);

assessmentsRouter.post(
  "/:assessmentId/results",
  ...requirePermission("assessment.enter_marks"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.enterMarksHandler)
);

assessmentsRouter.post(
  "/:assessmentId/submit",
  ...requirePermission("assessment.submit"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.submitAssessmentHandler)
);

assessmentsRouter.post(
  "/:assessmentId/archive",
  ...requirePermission("assessment.edit"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.archiveAssessmentHandler)
);

assessmentsRouter.post(
  "/results/:resultId/request-correction",
  ...requirePermission("assessment.enter_marks"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.requestMarksCorrectionHandler)
);

assessmentsRouter.post(
  "/corrections/:approvalId/decide",
  ...requirePermission("assessment.correct"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.decideMarksCorrectionHandler)
);
