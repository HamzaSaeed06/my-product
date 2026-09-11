import type { Response } from "express";
import { env, isProduction } from "../config/env.js";

export const COOKIE_NAMES = {
  accessToken: "providerAccessToken",
  refreshToken: "providerRefreshToken",
  csrfToken: "providerCsrfToken",
} as const;

const baseCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict" as const,
  path: "/",
};

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string; csrfToken: string }
): void {
  res.cookie(COOKIE_NAMES.accessToken, tokens.accessToken, {
    ...baseCookieOptions,
    maxAge: env.ACCESS_TOKEN_TTL_MINUTES * 60 * 1000,
  });
  res.cookie(COOKIE_NAMES.refreshToken, tokens.refreshToken, {
    ...baseCookieOptions,
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  });
  res.cookie(COOKIE_NAMES.csrfToken, tokens.csrfToken, {
    ...baseCookieOptions,
    httpOnly: false,
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res: Response): void {
  for (const name of Object.values(COOKIE_NAMES)) {
    res.clearCookie(name, { ...baseCookieOptions, httpOnly: name !== COOKIE_NAMES.csrfToken });
  }
}
