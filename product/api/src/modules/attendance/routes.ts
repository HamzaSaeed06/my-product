import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const attendanceRouter = Router();

attendanceRouter.get("/", ...requirePermission("attendance.view"), asyncHandler(controller.listAttendanceHandler));

attendanceRouter.post(
  "/",
  ...requirePermission("attendance.mark"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.markAttendanceHandler)
);

attendanceRouter.post(
  "/:attendanceId/request-correction",
  ...requirePermission("attendance.mark"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.requestAttendanceCorrectionHandler)
);

attendanceRouter.post(
  "/corrections/:approvalId/decide",
  ...requirePermission("attendance.correct"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.decideAttendanceCorrectionHandler)
);
