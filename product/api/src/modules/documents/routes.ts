import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";
import { documentUpload } from "../../lib/upload.js";

export const documentsRouter = Router();

documentsRouter.get(
  "/",
  ...requirePermission("document.view"),
  asyncHandler(controller.listDocumentsHandler)
);

documentsRouter.get(
  "/:documentId/download",
  ...requirePermission("document.view"),
  asyncHandler(controller.downloadDocumentHandler)
);

documentsRouter.post(
  "/",
  ...requirePermission("document.upload"),
  csrfProtection,
  writeRateLimiter,
  documentUpload.single("file"),
  asyncHandler(controller.uploadDocumentHandler)
);
