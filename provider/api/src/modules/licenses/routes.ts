import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireRole } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const licensesRouter = Router();

licensesRouter.get("/", ...requireRole("ADMIN", "SUPPORT_READ_ONLY"), asyncHandler(controller.listLicensesHandler));
licensesRouter.get(
  "/:licenseId",
  ...requireRole("ADMIN", "SUPPORT_READ_ONLY"),
  asyncHandler(controller.getLicenseHandler)
);
licensesRouter.post(
  "/",
  ...requireRole("ADMIN"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.generateLicenseHandler)
);
licensesRouter.post(
  "/:licenseId/activate",
  ...requireRole("ADMIN"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.activateLicenseHandler)
);
licensesRouter.post(
  "/:licenseId/suspend",
  ...requireRole("ADMIN"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.suspendLicenseHandler)
);
licensesRouter.post(
  "/:licenseId/revoke",
  ...requireRole("ADMIN"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.revokeLicenseHandler)
);
