import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { authenticate } from "../../middleware/authenticate.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const staffAttendanceRouter = Router();

// Any authenticated staff member can see their own check-in history —
// same "self view needs no special permission" pattern as
// GET /delegations/mine.
staffAttendanceRouter.get("/mine", authenticate, asyncHandler(controller.listMyStaffAttendanceHandler));

// Deliberately its own permission, separate from staff_attendance.view —
// this is "what gets printed/displayed at reception", not attendance data
// itself, and must stay restricted (anyone who could fetch today's valid
// token via API, without being physically present, defeats the entire
// anti-spoofing point of the QR flow).
staffAttendanceRouter.get("/qr-token", ...requirePermission("staff_attendance.qr_manage"), asyncHandler(controller.getQrDisplayTokenHandler));

staffAttendanceRouter.get("/", ...requirePermission("staff_attendance.view"), asyncHandler(controller.listStaffAttendanceHandler));

staffAttendanceRouter.post(
  "/check-in",
  ...requirePermission("staff_attendance.checkin"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.checkInHandler)
);

staffAttendanceRouter.post(
  "/mark",
  ...requirePermission("staff_attendance.mark"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.markStaffAttendanceHandler)
);

staffAttendanceRouter.post(
  "/remote-approve",
  ...requirePermission("staff_attendance.remote_approve"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.grantRemoteApprovedHandler)
);
