import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { API_URL, COOKIE_NAMES, type ApiProviderUser } from "./api";

export const getCurrentUser = cache(async (): Promise<ApiProviderUser | null> => {
  const cookieStore = await cookies();

  if (!cookieStore.has(COOKIE_NAMES.accessToken)) {
    return null;
  }

  const res = await fetch(`${API_URL}/api/v1/auth/me`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });

  if (!res.ok) return null;

  const body = (await res.json()) as { user: ApiProviderUser };
  return body.user;
});
