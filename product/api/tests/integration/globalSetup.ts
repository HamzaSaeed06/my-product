import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import request from "supertest";
import { createApp } from "../../src/app.js";

// Runs once for the whole integration run, in a separate process from the
// test files. Logs in exactly once and persists the session to a temp file
// so every test file can reuse it — this is what keeps us under the login
// endpoint's 5-req/min rate limit even though many test files hit protected
// routes.
const SESSION_FILE = path.resolve(import.meta.dirname, ".session.json");

const EMAIL = process.env.TEST_SUPERADMIN_EMAIL ?? "admin@myproduct.local";
const PASSWORD = process.env.TEST_SUPERADMIN_PASSWORD ?? "Str0ng!Passw0rd";

export default async function setup() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set — integration tests require a real Postgres database. " +
        "Set it in product/api/.env before running `npm run test:integration`."
    );
  }

  const app = createApp();
  const res = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: EMAIL, password: PASSWORD });

  if (res.status !== 200) {
    throw new Error(
      `Integration test setup failed to log in as ${EMAIL} (status ${res.status}): ` +
        `${JSON.stringify(res.body)}. Run "npm run create-super-admin" first if this ` +
        "user doesn't exist yet, or set TEST_SUPERADMIN_EMAIL/PASSWORD to a valid account."
    );
  }

  const setCookieHeader = res.headers["set-cookie"] as unknown as string[];
  const cookieHeader = setCookieHeader.map((c) => c.split(";")[0]).join("; ");

  fs.writeFileSync(
    SESSION_FILE,
    JSON.stringify({ cookieHeader, csrfToken: res.body.csrfToken, userId: res.body.user.id })
  );

  return async () => {
    fs.rmSync(SESSION_FILE, { force: true });
  };
}
