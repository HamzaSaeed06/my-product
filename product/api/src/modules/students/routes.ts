import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";
import { documentUpload, verifyUploadedFileType } from "../../lib/upload.js";

export const studentsRouter = Router();

studentsRouter.get("/search", ...requirePermission("student.view"), asyncHandler(controller.searchStudentsHandler));
studentsRouter.get("/", ...requirePermission("student.view"), asyncHandler(controller.listStudentsHandler));
studentsRouter.get("/:studentId", ...requirePermission("student.view"), asyncHandler(controller.getStudentHandler));

studentsRouter.post(
  "/",
  ...requirePermission("student.create"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.createStudentHandler)
);

studentsRouter.patch(
  "/:studentId",
  ...requirePermission("student.edit"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.updateStudentHandler)
);

studentsRouter.post(
  "/:studentId/withdraw",
  ...requirePermission("student.archive"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.withdrawStudentHandler)
);

studentsRouter.post(
  "/:studentId/archive",
  ...requirePermission("student.archive"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.archiveStudentHandler)
);

studentsRouter.get(
  "/:studentId/documents",
  ...requirePermission("document.view"),
  asyncHandler(controller.listStudentDocumentsHandler)
);

studentsRouter.post(
  "/:studentId/documents",
  ...requirePermission("document.upload"),
  csrfProtection,
  writeRateLimiter,
  documentUpload.single("file"),
  verifyUploadedFileType,
  asyncHandler(controller.uploadStudentDocumentHandler)
);
