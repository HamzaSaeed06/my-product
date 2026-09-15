import { defineConfig } from "vitest/config";

// Unit tests only — no database required. Safe to run in any environment,
// including CI without a provisioned Postgres. See vitest.integration.config.ts
// for the DB-backed suite (tests/integration/provider-platform.test.ts).
//
// Before this file existed, the bare `npm test` (`vitest run`, no -c flag)
// fell back to Vitest's built-in defaults: no include-pattern restriction,
// so it discovered tests/integration/provider-platform.test.ts on its own
// and ran it straight against the real Neon DATABASE_URL from .env — with
// the default 5s testTimeout / 10s hookTimeout instead of the 20s/30s this
// project actually needs for Neon's latency (see
// vitest.integration.config.ts and docs/PROJECT_STATUS.md §5a). That both
// mutated real dev data on every "unit test" run and produced spurious
// timeout failures. Scoping to tests/unit/ makes `npm test` DB-free again,
// matching product/api's separation.
//
// No unit test files exist yet for this workspace — passWithNoTests keeps
// `npm test` exiting 0 (instead of erroring "No test files found") until
// some are added.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    passWithNoTests: true,
  },
});
