"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { API_URL } from "@/lib/api";

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const csrfToken = cookieStore.get("csrfToken")?.value ?? "";

  try {
    await fetch(`${API_URL}/api/v1/auth/logout`, {
      method: "POST",
      headers: { Cookie: cookieStore.toString(), "X-CSRF-Token": csrfToken },
      cache: "no-store",
    });
  } catch {
    // Best-effort: even if the API call fails (network blip, already
    // expired session), we still clear local cookies below so the user
    // isn't stuck "logged in" on this app with no way back to /login.
  }

  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
  cookieStore.delete("csrfToken");

  redirect("/login");
}
