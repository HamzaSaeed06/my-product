import { prisma } from "../../lib/prisma.js";
import { verifyPassword } from "../../lib/password.js";
import { generateRefreshToken, hashRefreshToken, generateCsrfToken, signAccessToken } from "../../lib/tokens.js";
import { writeAuditLog } from "../../lib/audit.js";
import { env } from "../../config/env.js";
import { HttpError } from "../../middleware/errorHandler.js";
import type { Request } from "express";

interface LoginInput {
  email: string;
  password: string;
  deviceInfo?: string | null;
  ipAddress?: string | null;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
}

export interface PublicProviderUser {
  id: string;
  email: string;
  fullName: string;
}

function toPublicUser(user: { id: string; email: string; fullName: string }): PublicProviderUser {
  return { id: user.id, email: user.email, fullName: user.fullName };
}

const INVALID_CREDENTIALS = "Invalid email or password";

export async function login(input: LoginInput): Promise<{ user: PublicProviderUser; tokens: AuthTokens }> {
  const user = await prisma.providerUser.findUnique({ where: { email: input.email } });

  if (!user || !user.isActive) {
    throw new HttpError(401, "INVALID_CREDENTIALS", INVALID_CREDENTIALS);
  }

  const passwordOk = await verifyPassword(user.passwordHash, input.password);
  if (!passwordOk) {
    throw new HttpError(401, "INVALID_CREDENTIALS", INVALID_CREDENTIALS);
  }

  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  const session = await prisma.session.create({
    data: {
      providerUserId: user.id,
      refreshTokenHash: hashRefreshToken(refreshToken),
      deviceInfo: input.deviceInfo ?? null,
      ipAddress: input.ipAddress ?? null,
      expiresAt,
    },
  });

  const accessToken = signAccessToken({ sub: user.id, sid: session.id });
  const csrfToken = generateCsrfToken();

  await writeAuditLog({ actorId: user.id, action: "LOGIN", resource: "Session", recordId: session.id, ipAddress: input.ipAddress });

  return { user: toPublicUser(user), tokens: { accessToken, refreshToken, csrfToken } };
}

export async function refresh(presentedRefreshToken: string): Promise<{ user: PublicProviderUser; tokens: AuthTokens }> {
  const presentedHash = hashRefreshToken(presentedRefreshToken);

  const session = await prisma.session.findFirst({
    where: { refreshTokenHash: presentedHash },
    include: { providerUser: true },
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    throw new HttpError(401, "SESSION_INVALID", "Refresh token invalid, expired, or revoked");
  }
  if (!session.providerUser.isActive) {
    throw new HttpError(401, "USER_INACTIVE", "User account is inactive");
  }

  const newRefreshToken = generateRefreshToken();
  const newExpiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  const [, newSession] = await prisma.$transaction([
    prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } }),
    prisma.session.create({
      data: {
        providerUserId: session.providerUserId,
        refreshTokenHash: hashRefreshToken(newRefreshToken),
        deviceInfo: session.deviceInfo,
        ipAddress: session.ipAddress,
        expiresAt: newExpiresAt,
      },
    }),
  ]);

  const accessToken = signAccessToken({ sub: session.providerUserId, sid: newSession.id });
  const csrfToken = generateCsrfToken();

  return { user: toPublicUser(session.providerUser), tokens: { accessToken, refreshToken: newRefreshToken, csrfToken } };
}

export async function logout(sessionId: string, actorId: string): Promise<void> {
  await prisma.session.update({ where: { id: sessionId }, data: { revokedAt: new Date() } });
  await writeAuditLog({ actorId, action: "LOGOUT", resource: "Session", recordId: sessionId });
}

export function extractIp(req: Request): string | null {
  return req.ip ?? null;
}

export async function getPublicUserById(userId: string): Promise<PublicProviderUser> {
  const user = await prisma.providerUser.findUniqueOrThrow({ where: { id: userId } });
  return toPublicUser(user);
}
