import { Router } from "express";
import * as controller from "./controller.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { authenticate } from "../../middleware/authenticate.js";
import { csrfProtection } from "../../middleware/csrf.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";

// Every route here is self-scoped (always req.user.id, never a param/body
// userId), so authentication alone is the correct gate — no permission
// check needed for "see my own notifications."
export const notificationsRouter = Router();

notificationsRouter.get("/", authenticate, asyncHandler(controller.listMyNotificationsHandler));

notificationsRouter.post(
  "/:notificationId/read",
  authenticate,
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.markAsReadHandler)
);

notificationsRouter.get("/preferences", authenticate, asyncHandler(controller.getPreferencesHandler));

notificationsRouter.put(
  "/preferences",
  authenticate,
  csrfProtection,
  writeRateLimiter,
  asyncHandler(controller.updatePreferencesHandler)
);
