"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  API_URL,
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
  parseCookiePairs,
} from "@/lib/api";

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
    return {
      fieldErrors: {
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      },
    };
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

  const body = (await apiRes.json().catch(() => ({}))) as {
    error?: string;
    message?: string;
    user?: { roles?: string[] };
  };

  if (!apiRes.ok) {
    if (body.error === "MFA_REQUIRED" || body.error === "MFA_INVALID") {
      return {
        formError: "This account requires a verification code, which isn't supported here yet.",
      };
    }
    if (apiRes.status === 429) {
      return { formError: "Too many attempts. Wait a minute before trying again." };
    }
    return { formError: body.message ?? "Invalid email or password." };
  }

  const cookiePairs = parseCookiePairs(apiRes.headers.getSetCookie());
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === "production";
  const baseOptions = { secure: isProd, sameSite: "strict" as const, path: "/" };

  if (cookiePairs.accessToken) {
    cookieStore.set("accessToken", cookiePairs.accessToken, {
      ...baseOptions,
      httpOnly: true,
      maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
    });
  }
  if (cookiePairs.refreshToken) {
    cookieStore.set("refreshToken", cookiePairs.refreshToken, {
      ...baseOptions,
      httpOnly: true,
      maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
    });
  }
  if (cookiePairs.csrfToken) {
    cookieStore.set("csrfToken", cookiePairs.csrfToken, {
      ...baseOptions,
      httpOnly: false,
      maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
    });
  }

  // Staff roles (SUPER_ADMIN/PRINCIPAL/INCHARGE/OFFICE) land on the
  // desktop admin shell; TEACHER/PARENT/STUDENT get the separate,
  // mobile-first portal shell — see PRODUCT_SPEC.md's Phase 7
  // "Mobile-First: Parent & Student portals" / "Teacher: teaching-focused
  // interface". A user with no roles at all can no longer reach this
  // point — product/api's login() rejects it with NO_ROLE_ASSIGNED before
  // issuing any cookies — but the fallback stays as defense in depth.
  const roles = body.user?.roles ?? [];
  const STAFF_ROLES = ["SUPER_ADMIN", "PRINCIPAL", "INCHARGE", "OFFICE"];
  const isStaff = roles.length === 0 || roles.some((r) => STAFF_ROLES.includes(r));

  redirect(isStaff ? "/dashboard" : "/portal");
}
