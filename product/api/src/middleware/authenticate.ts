import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { COOKIE_NAMES } from "../lib/cookies.js";
import { verifyAccessToken } from "../lib/tokens.js";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "./errorHandler.js";
import { getActiveDelegationsForUser } from "../lib/delegation.js";
import { runWithDelegationContext } from "../lib/requestContext.js";

// Authenticates the request: verifies the access token JWT, then confirms
// the backing Session is still valid (not revoked/expired). The extra DB
// check is what makes "password change invalidates all sessions" and
// "role change invalidates all sessions" (PRODUCT_SPEC.md §8) take effect
// immediately rather than waiting for the access token to naturally expire.
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.[COOKIE_NAMES.accessToken];

  if (!token) {
    next(new HttpError(401, "UNAUTHENTICATED", "No access token"));
    return;
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(new HttpError(401, "ACCESS_TOKEN_EXPIRED", "Access token expired — refresh required"));
      return;
    }
    next(new HttpError(401, "UNAUTHENTICATED", "Invalid access token"));
    return;
  }

  const session = await prisma.session.findUnique({ where: { id: payload.sid } });

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    next(new HttpError(401, "SESSION_INVALID", "Session has been revoked or expired"));
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });

  if (!user || !user.isActive) {
    next(new HttpError(401, "USER_INACTIVE", "User account is inactive"));
    return;
  }

  req.user = { id: user.id, sessionId: session.id };

  // Phase 11 Phase A2 — computed once here, not repeated in every function
  // that needs it (see requestContext.ts for why this can't just be a
  // field on `req`).
  const activeDelegations = await getActiveDelegationsForUser(user.id);
  runWithDelegationContext(activeDelegations, () => next());
}
