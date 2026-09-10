import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AccessTokenPayload {
  sub: string; // userId
  sid: string; // sessionId — lets us revoke a specific session's access tokens by checking session state
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: `${env.ACCESS_TOKEN_TTL_MINUTES}m`,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

// Refresh tokens are opaque random strings, never JWTs — the DB (Session
// model) is the source of truth so we can revoke/rotate them. Only the
// SHA-256 hash is ever stored, per PRODUCT_SPEC.md's Session model comment
// ("refreshToken: string (hashed)").
export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
