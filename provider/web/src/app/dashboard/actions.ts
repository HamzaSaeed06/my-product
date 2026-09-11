"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { API_URL, COOKIE_NAMES } from "@/lib/api";

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const csrfToken = cookieStore.get(COOKIE_NAMES.csrfToken)?.value ?? "";

  try {
    await fetch(`${API_URL}/api/v1/auth/logout`, {
      method: "POST",
      headers: { Cookie: cookieStore.toString(), "X-CSRF-Token": csrfToken },
      cache: "no-store",
    });
  } catch {
    // Best-effort — clear local cookies regardless.
  }

  cookieStore.delete(COOKIE_NAMES.accessToken);
  cookieStore.delete(COOKIE_NAMES.refreshToken);
  cookieStore.delete(COOKIE_NAMES.csrfToken);

  redirect("/login");
}
