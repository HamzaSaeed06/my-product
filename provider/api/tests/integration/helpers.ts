import request from "supertest";
import { createApp } from "../../src/app.js";

interface StoredSession {
  cookieHeader: string;
  csrfToken: string;
  userId: string;
}

type Method = "get" | "post" | "patch" | "put" | "delete";

// Only one test file exists on this platform (see provider-platform.test.ts)
// so, unlike product/api's helpers.ts, there's no cross-file session-sharing
// or auto-refresh-on-401 machinery needed — one login per run comfortably
// outlives the file's own runtime, well inside the 20-minute access-token TTL.
function makeRequest(method: Method, url: string, session: StoredSession): request.Test {
  const app = createApp();
  return request(app)[method](url).set("Cookie", session.cookieHeader).set("X-CSRF-Token", session.csrfToken);
}

export async function loginAsProviderUser(email: string, password: string) {
  const app = createApp();
  const res = await request(app).post("/api/v1/auth/login").send({ email, password });
  if (res.status !== 200) {
    throw new Error(`Provider login failed for ${email} (status ${res.status}): ${JSON.stringify(res.body)}`);
  }
  const setCookieHeader = res.headers["set-cookie"] as unknown as string[];
  const cookieHeader = setCookieHeader.map((c) => c.split(";")[0]).join("; ");
  const session: StoredSession = { cookieHeader, csrfToken: res.body.csrfToken, userId: res.body.user.id };

  return {
    userId: session.userId,
    get: (url: string) => makeRequest("get", url, session),
    post: (url: string) => makeRequest("post", url, session),
    patch: (url: string) => makeRequest("patch", url, session),
    put: (url: string) => makeRequest("put", url, session),
    delete: (url: string) => makeRequest("delete", url, session),
  };
}

export function uniqueSuffix(): string {
  return Math.random().toString(36).slice(2, 10);
}
