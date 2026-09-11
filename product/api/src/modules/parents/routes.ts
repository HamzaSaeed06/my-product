import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const parentsRouter = Router();

parentsRouter.get("/search", ...requirePermission("parent.view"), asyncHandler(controller.searchParentsHandler));
parentsRouter.get("/", ...requirePermission("parent.view"), asyncHandler(controller.listParentsHandler));

parentsRouter.post(
  "/",
  ...requirePermission("parent.create"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.createParentHandler)
);

parentsRouter.patch(
  "/:parentId",
  ...requirePermission("parent.edit"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.updateParentHandler)
);

parentsRouter.post(
  "/:parentId/children",
  ...requirePermission("parent.edit"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.linkChildHandler)
);

parentsRouter.delete(
  "/:parentId/children/:linkId",
  ...requirePermission("parent.edit"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.unlinkChildHandler)
);
