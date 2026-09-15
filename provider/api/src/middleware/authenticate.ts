import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { COOKIE_NAMES } from "../lib/cookies.js";
import { verifyAccessToken } from "../lib/tokens.js";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "./errorHandler.js";

// Answers "is this a real, still-valid session." — the role check (which
// routes this session may use) is a separate concern, see authorize.ts.
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

  const providerUser = await prisma.providerUser.findUnique({ where: { id: payload.sub } });
  if (!providerUser || !providerUser.isActive) {
    next(new HttpError(401, "USER_INACTIVE", "User account is inactive"));
    return;
  }

  req.providerUser = { id: providerUser.id, sessionId: session.id, role: providerUser.role };
  next();
}
