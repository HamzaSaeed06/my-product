import fs from "node:fs";
import path from "node:path";
import request from "supertest";
import { createApp } from "../../src/app.js";

interface StoredSession {
  cookieHeader: string;
  csrfToken: string;
  userId: string;
}

const SESSION_FILE = path.resolve(import.meta.dirname, ".session.json");

function loadSession(): StoredSession {
  return JSON.parse(fs.readFileSync(SESSION_FILE, "utf-8"));
}

function saveSession(session: StoredSession): void {
  fs.writeFileSync(SESSION_FILE, JSON.stringify(session));
}

// The shared session's access token has a real, intentional 20-minute TTL
// (a production security setting, not a test artifact). A full integration
// run can now legitimately take longer than that under this environment's
// observed network latency (see docs/PROJECT_STATUS.md §5a), so later test
// files were starting to see every request fail with a confusing 401
// ACCESS_TOKEN_EXPIRED. This refreshes via the refresh token (7-day TTL)
// and persists the new session to disk so every subsequent asSuperAdmin()
// call — in this file and any file that runs after — picks it up too.
async function refreshSession(session: StoredSession): Promise<StoredSession> {
  const app = createApp();
  const res = await request(app).post("/api/v1/auth/refresh").set("Cookie", session.cookieHeader);
  if (res.status !== 200) {
    throw new Error(`Session refresh failed (status ${res.status}): ${JSON.stringify(res.body)}`);
  }
  const setCookieHeader = res.headers["set-cookie"] as unknown as string[];
  const cookieHeader = setCookieHeader.map((c) => c.split(";")[0]).join("; ");
  const refreshed: StoredSession = { cookieHeader, csrfToken: res.body.csrfToken, userId: res.body.user.id };
  saveSession(refreshed);
  return refreshed;
}

type Method = "get" | "post" | "patch" | "put" | "delete";

// A Proxy around a supertest request chain: every chained call (.send(),
// .field(), .attach(), ...) is recorded rather than immediately fired, so
// the exact same chain can be rebuilt and replayed against a freshly
// refreshed session if the first attempt comes back 401
// ACCESS_TOKEN_EXPIRED. Only `.then()` is specially handled — that's the
// one thing `await` actually needs from a thenable.
function makeRequest(method: Method, url: string, initialSession: StoredSession): request.Test {
  const app = createApp();
  const calls: { name: string; args: unknown[] }[] = [];

  function build(session: StoredSession): request.Test {
    let test = request(app)
      [method](url)
      .set("Cookie", session.cookieHeader);
    if (method !== "get") {
      test = test.set("X-CSRF-Token", session.csrfToken);
    }
    for (const call of calls) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      test = (test as any)[call.name](...call.args);
    }
    return test;
  }

  const target = build(initialSession);

  return new Proxy(target, {
    get(rawTarget, prop, receiver) {
      if (prop === "then") {
        return (onFulfilled: (v: unknown) => unknown, onRejected: (e: unknown) => unknown) =>
          (async () => {
            let session = initialSession;
            let res = await build(session);
            if (res.status === 401 && (res.body as { error?: string } | undefined)?.error === "ACCESS_TOKEN_EXPIRED") {
              session = await refreshSession(session);
              res = await build(session);
            }
            return res;
          })().then(onFulfilled, onRejected);
      }
      const value = Reflect.get(rawTarget, prop, receiver);
      if (typeof value === "function") {
        return (...args: unknown[]) => {
          calls.push({ name: prop as string, args });
          return receiver;
        };
      }
      return value;
    },
  }) as request.Test;
}

// A fresh app instance per call is cheap (no DB connection is opened until a
// route actually queries Prisma) and keeps tests independent.
export function asSuperAdmin() {
  const session = loadSession();

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
