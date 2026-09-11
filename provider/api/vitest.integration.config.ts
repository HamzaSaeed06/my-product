import { defineConfig } from "vitest/config";

// Integration tests — require a real DATABASE_URL (provider schema) and hit
// it for real. Only one test file exists so far, so unlike product/api's
// config there's no globalSetup/shared-session needed — each file logs in
// for itself. Same widened hook timeout for observed Neon latency — see
// docs/PROJECT_STATUS.md §5a.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    fileParallelism: false,
    pool: "forks",
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
