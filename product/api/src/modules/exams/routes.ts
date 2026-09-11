import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const examsRouter = Router();

examsRouter.get("/", ...requirePermission("exam.view"), asyncHandler(controller.listExamsHandler));

examsRouter.post(
  "/",
  ...requirePermission("exam.create"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.createExamHandler)
);

examsRouter.post(
  "/:examId/publish",
  ...requirePermission("exam.publish"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.publishExamHandler)
);
