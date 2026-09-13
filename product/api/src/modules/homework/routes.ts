import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";
import { documentUpload, verifyUploadedFileType } from "../../lib/upload.js";

export const homeworkRouter = Router();

homeworkRouter.get("/", ...requirePermission("homework.view"), asyncHandler(controller.listHomeworkHandler));

homeworkRouter.post(
  "/",
  ...requirePermission("homework.create"),
  csrfProtection,
  writeRateLimiter,
  documentUpload.array("files", 10),
  verifyUploadedFileType,
  asyncHandler(controller.createHomeworkHandler)
);

homeworkRouter.post(
  "/:homeworkId/attachments",
  ...requirePermission("homework.edit"),
  csrfProtection,
  writeRateLimiter,
  documentUpload.single("file"),
  verifyUploadedFileType,
  asyncHandler(controller.addHomeworkAttachmentHandler)
);

homeworkRouter.patch(
  "/:homeworkId",
  ...requirePermission("homework.edit"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.updateHomeworkHandler)
);

homeworkRouter.post(
  "/:homeworkId/publish",
  ...requirePermission("homework.publish"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.publishHomeworkHandler)
);

homeworkRouter.post(
  "/:homeworkId/archive",
  ...requirePermission("homework.edit"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.archiveHomeworkHandler)
);
