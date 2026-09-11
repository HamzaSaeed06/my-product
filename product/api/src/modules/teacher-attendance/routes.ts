import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const teacherAttendanceRouter = Router();

teacherAttendanceRouter.get(
  "/",
  ...requirePermission("teacher_attendance.view"),
  asyncHandler(controller.listTeacherAttendanceHandler)
);

teacherAttendanceRouter.post(
  "/",
  ...requirePermission("teacher_attendance.mark"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.markTeacherAttendanceHandler)
);

teacherAttendanceRouter.patch(
  "/:recordId",
  ...requirePermission("teacher_attendance.correct"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.correctTeacherAttendanceHandler)
);
