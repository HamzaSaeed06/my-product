import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const sectionsRouter = Router();

sectionsRouter.get("/", ...requirePermission("section.view"), asyncHandler(controller.listSectionsHandler));

sectionsRouter.post(
  "/",
  ...requirePermission("section.create"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.createSectionHandler)
);

sectionsRouter.patch(
  "/:sectionId",
  ...requirePermission("section.edit"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.updateSectionHandler)
);

sectionsRouter.post(
  "/:sectionId/archive",
  ...requirePermission("section.archive"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.archiveSectionHandler)
);
