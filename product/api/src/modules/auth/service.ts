import { prisma } from "../../lib/prisma.js";
import { verifyPassword } from "../../lib/password.js";
import { verifyMfaToken, generateMfaSecret, buildMfaOtpAuthUrl } from "../../lib/mfa.js";
import {
  generateRefreshToken,
  hashRefreshToken,
  generateCsrfToken,
  signAccessToken,
} from "../../lib/tokens.js";
import { writeAuditLog } from "../../lib/audit.js";
import { env } from "../../config/env.js";
import { HttpError } from "../../middleware/errorHandler.js";
import type { Request } from "express";

interface LoginInput {
  email: string;
  password: string;
  mfaCode?: string;
  deviceInfo?: string | null;
  ipAddress?: string | null;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
}

export interface PublicUser {
  id: string;
  email: string;
  fullName: string;
}

function toPublicUser(user: { id: string; email: string; fullName: string }): PublicUser {
  return { id: user.id, email: user.email, fullName: user.fullName };
}

// Generic message on purpose — never reveal whether the email exists or the
// password was wrong (standard credential-enumeration defense).
const INVALID_CREDENTIALS = "Invalid email or password";

export async function login(input: LoginInput): Promise<{ user: PublicUser; tokens: AuthTokens }> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user || !user.isActive) {
    throw new HttpError(401, "INVALID_CREDENTIALS", INVALID_CREDENTIALS);
  }

  const passwordOk = await verifyPassword(user.passwordHash, input.password);
  if (!passwordOk) {
    throw new HttpError(401, "INVALID_CREDENTIALS", INVALID_CREDENTIALS);
  }

  if (user.mfaEnabled) {
    if (!input.mfaCode) {
      throw new HttpError(401, "MFA_REQUIRED", "MFA code required");
    }
    if (!user.mfaSecret || !verifyMfaToken(user.mfaSecret, input.mfaCode)) {
      throw new HttpError(401, "MFA_INVALID", "Invalid MFA code");
    }
  }

  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      refreshTokenHash: hashRefreshToken(refreshToken),
      deviceInfo: input.deviceInfo ?? null,
      ipAddress: input.ipAddress ?? null,
      expiresAt,
    },
  });

  const accessToken = signAccessToken({ sub: user.id, sid: session.id });
  const csrfToken = generateCsrfToken();

  await writeAuditLog({
    actorId: user.id,
    action: "LOGIN",
    resource: "Session",
    recordId: session.id,
    ipAddress: input.ipAddress,
  });

  return { user: toPublicUser(user), tokens: { accessToken, refreshToken, csrfToken } };
}

export async function refresh(
  presentedRefreshToken: string
): Promise<{ user: PublicUser; tokens: AuthTokens }> {
  const presentedHash = hashRefreshToken(presentedRefreshToken);

  const session = await prisma.session.findFirst({
    where: { refreshTokenHash: presentedHash },
    include: { user: true },
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    throw new HttpError(401, "SESSION_INVALID", "Refresh token invalid, expired, or revoked");
  }

  if (!session.user.isActive) {
    throw new HttpError(401, "USER_INACTIVE", "User account is inactive");
  }

  // Rotation: revoke the old session record, issue a brand new one. This
  // limits the replay window of a stolen refresh token per PRODUCT_SPEC.md
  // §8 ("Refresh token rotation: Implemented").
  const newRefreshToken = generateRefreshToken();
  const newExpiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  const [, newSession] = await prisma.$transaction([
    prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } }),
    prisma.session.create({
      data: {
        userId: session.userId,
        refreshTokenHash: hashRefreshToken(newRefreshToken),
        deviceInfo: session.deviceInfo,
        ipAddress: session.ipAddress,
        expiresAt: newExpiresAt,
      },
    }),
  ]);

  const accessToken = signAccessToken({ sub: session.userId, sid: newSession.id });
  const csrfToken = generateCsrfToken();

  return {
    user: toPublicUser(session.user),
    tokens: { accessToken, refreshToken: newRefreshToken, csrfToken },
  };
}

export async function logout(sessionId: string, actorId: string): Promise<void> {
  await prisma.session.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  });

  await writeAuditLog({ actorId, action: "LOGOUT", resource: "Session", recordId: sessionId });
}

// Invalidates every active session for a user — used on password change and
// on role change, per PRODUCT_SPEC.md §8 Authentication ("Password change
// invalidates all active sessions", "Role change invalidates all active
// sessions").
export async function revokeAllSessions(userId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function setupMfa(userId: string): Promise<{ secret: string; otpAuthUrl: string }> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const secret = generateMfaSecret();
  await prisma.user.update({ where: { id: userId }, data: { mfaSecret: secret, mfaEnabled: false } });
  return { secret, otpAuthUrl: buildMfaOtpAuthUrl(user.email, secret) };
}

export async function confirmMfa(userId: string, token: string): Promise<void> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!user.mfaSecret || !verifyMfaToken(user.mfaSecret, token)) {
    throw new HttpError(400, "MFA_INVALID", "Invalid MFA code — setup not confirmed");
  }
  await prisma.user.update({ where: { id: userId }, data: { mfaEnabled: true } });
}

export function extractIp(req: Request): string | null {
  return req.ip ?? null;
}
