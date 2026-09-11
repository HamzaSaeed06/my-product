import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { authenticate } from "../../middleware/authenticate.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const licensesRouter = Router();

licensesRouter.get("/", authenticate, asyncHandler(controller.listLicensesHandler));
licensesRouter.get("/:licenseId", authenticate, asyncHandler(controller.getLicenseHandler));
licensesRouter.post("/", authenticate, csrfProtection, writeRateLimiter, asyncHandler(controller.generateLicenseHandler));
licensesRouter.post("/:licenseId/activate", authenticate, csrfProtection, writeRateLimiter, asyncHandler(controller.activateLicenseHandler));
licensesRouter.post("/:licenseId/suspend", authenticate, csrfProtection, writeRateLimiter, asyncHandler(controller.suspendLicenseHandler));
licensesRouter.post("/:licenseId/revoke", authenticate, csrfProtection, writeRateLimiter, asyncHandler(controller.revokeLicenseHandler));
