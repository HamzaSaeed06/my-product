import { NextResponse, type NextRequest } from "next/server";
import { API_URL, COOKIE_NAMES, ACCESS_TOKEN_MAX_AGE_SECONDS, REFRESH_TOKEN_MAX_AGE_SECONDS, parseCookiePairs } from "@/lib/api";

// Same silent-refresh-on-expiry logic as product/web's src/proxy.ts — see
// that file's comment for the full reasoning (why this must run in Proxy,
// not inside a Server Component). Distinct cookie names here since
// provider/web has its own namespace (providerAccessToken etc.).
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const hasAccessToken = request.cookies.has(COOKIE_NAMES.accessToken);
  const refreshToken = request.cookies.get(COOKIE_NAMES.refreshToken)?.value;

  if (hasAccessToken || !refreshToken) {
    return NextResponse.next();
  }

  let apiRes: Response;
  try {
    apiRes = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { Cookie: `${COOKIE_NAMES.refreshToken}=${refreshToken}` },
      cache: "no-store",
    });
  } catch {
    return NextResponse.next();
  }

  if (!apiRes.ok) {
    return NextResponse.next();
  }

  const cookiePairs = parseCookiePairs(apiRes.headers.getSetCookie());
  const isProd = process.env.NODE_ENV === "production";
  const baseOptions = { secure: isProd, sameSite: "strict" as const, path: "/" };

  if (cookiePairs[COOKIE_NAMES.accessToken]) request.cookies.set(COOKIE_NAMES.accessToken, cookiePairs[COOKIE_NAMES.accessToken]);
  if (cookiePairs[COOKIE_NAMES.refreshToken]) request.cookies.set(COOKIE_NAMES.refreshToken, cookiePairs[COOKIE_NAMES.refreshToken]);
  if (cookiePairs[COOKIE_NAMES.csrfToken]) request.cookies.set(COOKIE_NAMES.csrfToken, cookiePairs[COOKIE_NAMES.csrfToken]);

  const response = NextResponse.next({ request });

  if (cookiePairs[COOKIE_NAMES.accessToken]) {
    response.cookies.set(COOKIE_NAMES.accessToken, cookiePairs[COOKIE_NAMES.accessToken], {
      ...baseOptions,
      httpOnly: true,
      maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
    });
  }
  if (cookiePairs[COOKIE_NAMES.refreshToken]) {
    response.cookies.set(COOKIE_NAMES.refreshToken, cookiePairs[COOKIE_NAMES.refreshToken], {
      ...baseOptions,
      httpOnly: true,
      maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
    });
  }
  if (cookiePairs[COOKIE_NAMES.csrfToken]) {
    response.cookies.set(COOKIE_NAMES.csrfToken, cookiePairs[COOKIE_NAMES.csrfToken], {
      ...baseOptions,
      httpOnly: false,
      maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
    });
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
