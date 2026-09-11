import type { Request, Response } from "express";
import { z } from "zod";
import * as authService from "./service.js";
import { setAuthCookies, clearAuthCookies, COOKIE_NAMES } from "../../lib/cookies.js";
import { HttpError } from "../../middleware/errorHandler.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginHandler(req: Request, res: Response): Promise<void> {
  const body = loginSchema.parse(req.body);

  const { user, tokens } = await authService.login({
    email: body.email,
    password: body.password,
    deviceInfo: req.get("user-agent") ?? null,
    ipAddress: authService.extractIp(req),
  });

  setAuthCookies(res, tokens);
  res.status(200).json({ user, csrfToken: tokens.csrfToken });
}

export async function refreshHandler(req: Request, res: Response): Promise<void> {
  const presentedRefreshToken = req.cookies?.[COOKIE_NAMES.refreshToken];
  if (!presentedRefreshToken) {
    throw new HttpError(401, "NO_REFRESH_TOKEN", "No refresh token cookie present");
  }

  const { user, tokens } = await authService.refresh(presentedRefreshToken);

  setAuthCookies(res, tokens);
  res.status(200).json({ user, csrfToken: tokens.csrfToken });
}

export async function logoutHandler(req: Request, res: Response): Promise<void> {
  if (req.providerUser) {
    await authService.logout(req.providerUser.sessionId, req.providerUser.id);
  }
  clearAuthCookies(res);
  res.status(204).send();
}

export async function meHandler(req: Request, res: Response): Promise<void> {
  const user = await authService.getPublicUserById(req.providerUser!.id);
  res.status(200).json({ user });
}
