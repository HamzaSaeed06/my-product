import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const admissionInquiriesRouter = Router();

admissionInquiriesRouter.get("/", ...requirePermission("admission_inquiry.view"), asyncHandler(controller.listAdmissionInquiriesHandler));
admissionInquiriesRouter.get("/:inquiryId", ...requirePermission("admission_inquiry.view"), asyncHandler(controller.getAdmissionInquiryHandler));

admissionInquiriesRouter.post(
  "/",
  ...requirePermission("admission_inquiry.create"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.createAdmissionInquiryHandler)
);

admissionInquiriesRouter.patch(
  "/:inquiryId",
  ...requirePermission("admission_inquiry.create"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.updateAdmissionInquiryHandler)
);

admissionInquiriesRouter.post(
  "/:inquiryId/convert",
  ...requirePermission("admission_inquiry.convert"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.convertAdmissionInquiryHandler)
);
