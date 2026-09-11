import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { API_URL, type ApiUser } from "./api";

/**
 * Authoritative auth check — forwards this app's cookies to the real API's
 * /auth/me. Returns null on any non-200 (not authenticated, expired,
 * revoked session). Does not attempt silent token refresh yet; see
 * PROJECT_STATUS.md open items.
 *
 * Wrapped in React's cache() so a layout + its page can both call this
 * without doubling the network round-trip within one request/render pass.
 */
export const getCurrentUser = cache(async (): Promise<ApiUser | null> => {
  const cookieStore = await cookies();

  if (!cookieStore.has("accessToken")) {
    return null;
  }

  const res = await fetch(`${API_URL}/api/v1/auth/me`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });

  if (!res.ok) return null;

  const body = (await res.json()) as { user: ApiUser };
  return body.user;
});
