// Runs the integration suite against a local Postgres container instead of
// the real Neon DATABASE_URL in .env — the full 51-file suite takes ~45
// minutes over Neon's network latency, ~4 minutes locally (see
// docs/PROJECT_STATUS.md's session log for the full story). Never touches
// the real .env; reads the local DB's connection string from
// .env.test.local (gitignored via the root .gitignore's `*.local` rule)
// and overrides DATABASE_URL only for the spawned vitest process.
//
// One-time setup (if .env.test.local doesn't exist yet, or the container
// was removed): start a Postgres container, e.g.
//   docker run -d --name product-test-db -e POSTGRES_PASSWORD=postgres \
//     -e POSTGRES_DB=product_test -p 5433:5432 postgres:16
// then apply the schema and bootstrap a test admin against it (all of
// these accept a DATABASE_URL override the same way this script does):
//   DATABASE_URL=<local-url> npm run prisma:seed
//   DATABASE_URL=<local-url> npx tsx scripts/create-institute.ts --name "Local Test Institute"
//   DATABASE_URL=<local-url> npx tsx scripts/create-super-admin.ts --email test-integration@myproduct.local --password "Str0ngTest!Pass1"
// (`prisma migrate deploy`/`db push` don't work with an env override here —
// Prisma's CLI has its own .env-loading that ignores an already-set
// process.env.DATABASE_URL — so apply prisma/migrations/*/migration.sql
// directly via `docker exec -i <container> psql -U postgres -d product_test`
// in order instead, once, when first setting the container up.)
//
// After a machine restart, the container just needs `docker start
// product-test-db` — its data persists until the container is removed.
//
// NEVER run this alongside another `vitest run -c vitest.integration.config.ts`
// invocation (e.g. this script and a plain Neon-targeted run) at the same
// time, even though they target different databases — both read/write the
// same tests/integration/.session.json file, and running two at once
// corrupts whichever one loses the race (learned the hard way: 48/53
// files failed when this happened).

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const apiRoot = path.resolve(import.meta.dirname, "..");
const envFile = path.join(apiRoot, ".env.test.local");
const sessionFile = path.join(apiRoot, "tests", "integration", ".session.json");

if (!fs.existsSync(envFile)) {
  console.error(`${envFile} not found — see this script's header comment for one-time setup.`);
  process.exit(1);
}

const localDatabaseUrl = fs
  .readFileSync(envFile, "utf-8")
  .split("\n")
  .map((line) => line.trim())
  .find((line) => line.startsWith("DATABASE_URL="))
  ?.slice("DATABASE_URL=".length)
  .replace(/^"|"$/g, "");

if (!localDatabaseUrl) {
  console.error(`${envFile} exists but has no DATABASE_URL= line.`);
  process.exit(1);
}

fs.rmSync(sessionFile, { force: true });

const result = spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", ["vitest", "run", "-c", "vitest.integration.config.ts", ...process.argv.slice(2)], {
  cwd: apiRoot,
  stdio: "inherit",
  shell: process.platform === "win32",
  env: {
    ...process.env,
    DATABASE_URL: localDatabaseUrl,
    TEST_SUPERADMIN_EMAIL: process.env.TEST_SUPERADMIN_EMAIL ?? "test-integration@myproduct.local",
    TEST_SUPERADMIN_PASSWORD: process.env.TEST_SUPERADMIN_PASSWORD ?? "Str0ngTest!Pass1",
  },
});

if (result.error) {
  console.error("Failed to spawn vitest:", result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
