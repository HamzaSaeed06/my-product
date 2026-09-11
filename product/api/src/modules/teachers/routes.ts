import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const teachersRouter = Router();

teachersRouter.get("/", ...requirePermission("teacher.view"), asyncHandler(controller.listTeachersHandler));

teachersRouter.post(
  "/",
  ...requirePermission("teacher.create"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.createTeacherHandler)
);

teachersRouter.patch(
  "/:teacherId",
  ...requirePermission("teacher.edit"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.updateTeacherHandler)
);

teachersRouter.post(
  "/:teacherId/archive",
  ...requirePermission("teacher.archive"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.archiveTeacherHandler)
);
