import { defineConfig } from "vitest/config";

// Unit tests only — no database required. Safe to run in any environment,
// including CI without a provisioned Postgres. See vitest.integration.config.ts
// for the DB-backed suite.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
  },
});
