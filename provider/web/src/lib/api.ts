// Server-only. This app never talks to provider/api directly from the
// browser — Server Actions/Server Components proxy the call and re-issue
// cookies on this app's own origin, same BFF pattern product/web uses for
// the customer app.
export const API_URL = process.env.API_URL ?? "http://localhost:4100";

// Mirrors provider/api's ACCESS_TOKEN_TTL_MINUTES / REFRESH_TOKEN_TTL_DAYS
// defaults.
export const ACCESS_TOKEN_MAX_AGE_SECONDS = 20 * 60;
export const REFRESH_TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

// Distinct cookie names from product/web's ("accessToken" etc.) — a
// deliberate namespace separation since these are two unrelated apps and
// unrelated sessions, matching provider/api's own COOKIE_NAMES choice.
export const COOKIE_NAMES = {
  accessToken: "providerAccessToken",
  refreshToken: "providerRefreshToken",
  csrfToken: "providerCsrfToken",
} as const;

export function parseCookiePairs(setCookieHeaders: string[]): Record<string, string> {
  const pairs: Record<string, string> = {};
  for (const header of setCookieHeaders) {
    const firstSegment = header.split(";", 1)[0];
    if (!firstSegment) continue;
    const eq = firstSegment.indexOf("=");
    if (eq === -1) continue;
    const name = firstSegment.slice(0, eq).trim();
    const value = firstSegment.slice(eq + 1).trim();
    if (name) pairs[name] = value;
  }
  return pairs;
}

export interface ApiProviderUser {
  id: string;
  email: string;
  fullName: string;
}
