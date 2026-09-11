import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const teacherAssignmentsRouter = Router();

teacherAssignmentsRouter.get(
  "/",
  ...requirePermission("teacher_assignment.view"),
  asyncHandler(controller.listTeacherAssignmentsHandler)
);

teacherAssignmentsRouter.post(
  "/",
  ...requirePermission("teacher_assignment.create"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.createTeacherAssignmentHandler)
);

teacherAssignmentsRouter.post(
  "/:assignmentId/archive",
  ...requirePermission("teacher_assignment.edit"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.archiveTeacherAssignmentHandler)
);
