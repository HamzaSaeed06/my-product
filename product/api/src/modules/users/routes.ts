import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requirePermission } from "../../middleware/guard.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

export const usersRouter = Router();

usersRouter.get("/", ...requirePermission("user.view"), asyncHandler(controller.listUsersHandler));

usersRouter.post(
  "/",
  ...requirePermission("user.create"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.createUserHandler)
);

usersRouter.patch(
  "/:userId",
  ...requirePermission("user.edit"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.updateUserHandler)
);

usersRouter.post(
  "/:userId/active",
  ...requirePermission("user.disable"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.setUserActiveHandler)
);

usersRouter.post(
  "/:userId/roles",
  ...requirePermission("user.edit"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.assignRoleHandler)
);

usersRouter.delete(
  "/:userId/roles/:userRoleId",
  ...requirePermission("user.edit"),
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.removeRoleHandler)
);
