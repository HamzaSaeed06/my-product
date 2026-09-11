import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const feeStructuresRouter = Router();

feeStructuresRouter.get("/", ...requirePermission("fee_structure.view"), asyncHandler(controller.listFeeStructuresHandler));

feeStructuresRouter.post(
  "/",
  ...requirePermission("fee_structure.create"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.createFeeStructureHandler)
);

feeStructuresRouter.post(
  "/:structureId/archive",
  ...requirePermission("fee_structure.edit"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.archiveFeeStructureHandler)
);
