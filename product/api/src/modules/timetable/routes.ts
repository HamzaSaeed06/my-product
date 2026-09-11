import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const timetableRouter = Router();

timetableRouter.get("/", ...requirePermission("timetable.view"), asyncHandler(controller.getOrCreateTimetableHandler));
timetableRouter.get("/:timetableId", ...requirePermission("timetable.view"), asyncHandler(controller.getTimetableHandler));

timetableRouter.post(
  "/:timetableId/entries",
  ...requirePermission("timetable.create"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.addTimetableEntryHandler)
);

timetableRouter.patch(
  "/entries/:entryId",
  ...requirePermission("timetable.edit"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.updateTimetableEntryHandler)
);

timetableRouter.delete(
  "/entries/:entryId",
  ...requirePermission("timetable.edit"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.removeTimetableEntryHandler)
);

timetableRouter.post(
  "/:timetableId/publish",
  ...requirePermission("timetable.publish"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.publishTimetableHandler)
);
