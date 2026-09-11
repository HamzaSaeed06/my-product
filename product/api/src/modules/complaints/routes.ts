import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const complaintsRouter = Router();

complaintsRouter.get("/", ...requirePermission("complaint.view"), asyncHandler(controller.listComplaintsHandler));
complaintsRouter.get("/:complaintId", ...requirePermission("complaint.view"), asyncHandler(controller.getComplaintHandler));

complaintsRouter.post(
  "/",
  ...requirePermission("complaint.create"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.createComplaintHandler)
);

complaintsRouter.post(
  "/:complaintId/assign",
  ...requirePermission("complaint.assign"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.assignComplaintHandler)
);

complaintsRouter.post(
  "/:complaintId/start-progress",
  ...requirePermission("complaint.assign"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.startComplaintProgressHandler)
);

complaintsRouter.post(
  "/:complaintId/notes",
  ...requirePermission("complaint.assign"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.addComplaintNoteHandler)
);

complaintsRouter.post(
  "/:complaintId/resolve",
  ...requirePermission("complaint.resolve"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.resolveComplaintHandler)
);

complaintsRouter.post(
  "/:complaintId/close",
  ...requirePermission("complaint.close"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.closeComplaintHandler)
);

complaintsRouter.post(
  "/:complaintId/reopen",
  ...requirePermission("complaint.create"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.reopenComplaintHandler)
);
