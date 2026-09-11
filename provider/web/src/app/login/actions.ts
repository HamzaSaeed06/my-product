"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { API_URL, COOKIE_NAMES, ACCESS_TOKEN_MAX_AGE_SECONDS, REFRESH_TOKEN_MAX_AGE_SECONDS, parseCookiePairs } from "@/lib/api";

const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export interface LoginState {
  formError?: string;
  fieldErrors?: {
    email?: string;
    password?: string;
  };
}

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return { fieldErrors: { email: fieldErrors.email?.[0], password: fieldErrors.password?.[0] } };
  }

  let apiRes: Response;
  try {
    apiRes = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });
  } catch {
    return { formError: "Couldn't reach the server. Check your connection and try again." };
  }

  const body = (await apiRes.json().catch(() => ({}))) as { error?: string; message?: string };

  if (!apiRes.ok) {
    if (apiRes.status === 429) {
      return { formError: "Too many attempts. Wait a minute before trying again." };
    }
    if (apiRes.status === 423) {
      return { formError: body.message ?? "This account is locked." };
    }
    return { formError: body.message ?? "Invalid email or password." };
  }

  const cookiePairs = parseCookiePairs(apiRes.headers.getSetCookie());
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === "production";
  const baseOptions = { secure: isProd, sameSite: "strict" as const, path: "/" };

  if (cookiePairs[COOKIE_NAMES.accessToken]) {
    cookieStore.set(COOKIE_NAMES.accessToken, cookiePairs[COOKIE_NAMES.accessToken], {
      ...baseOptions,
      httpOnly: true,
      maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
    });
  }
  if (cookiePairs[COOKIE_NAMES.refreshToken]) {
    cookieStore.set(COOKIE_NAMES.refreshToken, cookiePairs[COOKIE_NAMES.refreshToken], {
      ...baseOptions,
      httpOnly: true,
      maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
    });
  }
  if (cookiePairs[COOKIE_NAMES.csrfToken]) {
    cookieStore.set(COOKIE_NAMES.csrfToken, cookiePairs[COOKIE_NAMES.csrfToken], {
      ...baseOptions,
      httpOnly: false,
      maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
    });
  }

  redirect("/dashboard");
}
