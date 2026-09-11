import { NextResponse, type NextRequest } from "next/server";
import { API_URL, ACCESS_TOKEN_MAX_AGE_SECONDS, REFRESH_TOKEN_MAX_AGE_SECONDS, parseCookiePairs } from "@/lib/api";

// The access token cookie's Max-Age is set to match ACCESS_TOKEN_TTL_MINUTES
// exactly (see login/actions.ts) — the browser deletes it on its own the
// moment it expires. So "accessToken cookie missing" is a reliable, free
// signal for "expired or never logged in", and "refreshToken cookie present"
// means there's a real 7-day-lived session worth trying to revive. Without
// this, every protected page load after 20 minutes of inactivity 401'd and
// bounced the user back to /login even though the whole point of a refresh
// token is to avoid exactly that — a real, previously-deferred gap, not a
// deliberate design choice.
//
// This has to run here (Next.js 16's `proxy.ts`, the renamed
// `middleware.ts` — same file convention, see AGENTS.md), not inside the
// page/layout itself: Next.js only allows setting cookies from a Server
// Action, a Route Handler, or Proxy — never mid-render in a Server
// Component, which is what every protected page currently is. Running
// before the page renders also means the page's own data fetch sees the
// *refreshed* cookies, not the stale ones — no extra round trip, no flash
// of a login redirect.
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const hasAccessToken = request.cookies.has("accessToken");
  const refreshToken = request.cookies.get("refreshToken")?.value;

  if (hasAccessToken || !refreshToken) {
    return NextResponse.next();
  }

  let apiRes: Response;
  try {
    apiRes = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { Cookie: `refreshToken=${refreshToken}` },
      cache: "no-store",
    });
  } catch {
    // Provider unreachable — fall through, the page's own request will
    // 401 and redirect to /login same as before this existed.
    return NextResponse.next();
  }

  if (!apiRes.ok) {
    // Refresh token itself is invalid/expired/revoked — nothing to revive.
    return NextResponse.next();
  }

  const cookiePairs = parseCookiePairs(apiRes.headers.getSetCookie());
  const isProd = process.env.NODE_ENV === "production";
  const baseOptions = { secure: isProd, sameSite: "strict" as const, path: "/" };

  // Mirror the refreshed cookies onto the *request* too (not just the
  // response) so this same request's downstream Server Components see the
  // live session immediately, per Next.js's own "Setting Headers" pattern
  // for making values available upstream within the same pass.
  if (cookiePairs.accessToken) request.cookies.set("accessToken", cookiePairs.accessToken);
  if (cookiePairs.refreshToken) request.cookies.set("refreshToken", cookiePairs.refreshToken);
  if (cookiePairs.csrfToken) request.cookies.set("csrfToken", cookiePairs.csrfToken);

  const response = NextResponse.next({ request });

  if (cookiePairs.accessToken) {
    response.cookies.set("accessToken", cookiePairs.accessToken, {
      ...baseOptions,
      httpOnly: true,
      maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
    });
  }
  if (cookiePairs.refreshToken) {
    response.cookies.set("refreshToken", cookiePairs.refreshToken, {
      ...baseOptions,
      httpOnly: true,
      maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
    });
  }
  if (cookiePairs.csrfToken) {
    response.cookies.set("csrfToken", cookiePairs.csrfToken, {
      ...baseOptions,
      httpOnly: false,
      maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
    });
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/portal/:path*"],
};
