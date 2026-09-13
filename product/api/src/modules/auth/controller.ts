import type { Request, Response } from "express";
import { z } from "zod";
import * as authService from "./service.js";
import { setAuthCookies, clearAuthCookies, COOKIE_NAMES } from "../../lib/cookies.js";
import { HttpError } from "../../middleware/errorHandler.js";
import { generateCsrfToken } from "../../lib/tokens.js";

// Accepts either field: "identifier" is the real, current name (can be an
// email, a CNIC, or a studentCode — Phase 11 Phase C-addendum); "email" is
// kept as an alias purely so the existing frontend login form (which still
// POSTs {email, password}) keeps working unchanged until it's updated to
// use the new field name and a non-email-typed input. At least one must be
// present.
const loginSchema = z
  .object({
    identifier: z.string().min(1).optional(),
    email: z.string().min(1).optional(),
    password: z.string().min(1),
    mfaCode: z.string().optional(),
  })
  .refine((data) => data.identifier || data.email, { message: "identifier is required" });

export async function loginHandler(req: Request, res: Response): Promise<void> {
  const body = loginSchema.parse(req.body);

  const { user, tokens } = await authService.login({
    identifier: (body.identifier ?? body.email)!,
    password: body.password,
    mfaCode: body.mfaCode,
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
  if (req.user) {
    await authService.logout(req.user.sessionId, req.user.id);
  }
  clearAuthCookies(res);
  res.status(204).send();
}

export async function meHandler(req: Request, res: Response): Promise<void> {
  // req.user is guaranteed by the `authenticate` middleware mounted on this route.
  const user = await authService.getPublicUserById(req.user!.id);
  res.status(200).json({ user });
}

export async function setupMfaHandler(req: Request, res: Response): Promise<void> {
  const result = await authService.setupMfa(req.user!.id);
  res.status(200).json(result);
}

const confirmMfaSchema = z.object({ token: z.string().min(6).max(6) });

export async function confirmMfaHandler(req: Request, res: Response): Promise<void> {
  const body = confirmMfaSchema.parse(req.body);
  await authService.confirmMfa(req.user!.id, body.token);
  res.status(204).send();
}

// Issued to any client without a session yet (e.g. before login) so the
// login form itself can be protected consistently if desired. Not required
// for the login endpoint today since login has no prior session to attach a
// csrf cookie to — kept for future use (e.g. public contact forms).
export function issueCsrfTokenHandler(_req: Request, res: Response): void {
  const csrfToken = generateCsrfToken();
  res.cookie(COOKIE_NAMES.csrfToken, csrfToken, { httpOnly: false, sameSite: "strict", path: "/" });
  res.status(200).json({ csrfToken });
}
