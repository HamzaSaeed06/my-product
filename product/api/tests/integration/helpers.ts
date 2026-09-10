import fs from "node:fs";
import path from "node:path";
import request from "supertest";
import { createApp } from "../../src/app.js";

interface StoredSession {
  cookieHeader: string;
  csrfToken: string;
  userId: string;
}

function loadSession(): StoredSession {
  const file = path.resolve(import.meta.dirname, ".session.json");
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

// A fresh app instance per call is cheap (no DB connection is opened until a
// route actually queries Prisma) and keeps tests independent.
export function asSuperAdmin() {
  const session = loadSession();
  const app = createApp();

  return {
    userId: session.userId,
    get: (url: string) => request(app).get(url).set("Cookie", session.cookieHeader),
    post: (url: string) =>
      request(app).post(url).set("Cookie", session.cookieHeader).set("X-CSRF-Token", session.csrfToken),
    patch: (url: string) =>
      request(app).patch(url).set("Cookie", session.cookieHeader).set("X-CSRF-Token", session.csrfToken),
    put: (url: string) =>
      request(app).put(url).set("Cookie", session.cookieHeader).set("X-CSRF-Token", session.csrfToken),
    delete: (url: string) =>
      request(app).delete(url).set("Cookie", session.cookieHeader).set("X-CSRF-Token", session.csrfToken),
  };
}

export function uniqueSuffix(): string {
  return Math.random().toString(36).slice(2, 10);
}
