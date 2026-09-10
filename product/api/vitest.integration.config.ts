import { defineConfig } from "vitest/config";

// Integration tests — require a real DATABASE_URL and hit it for real.
// Run explicitly with `npm run test:integration`, never as part of the
// default `npm test`. Single fork + sequential files: these share one
// logged-in session (see globalSetup) and the same live database, so
// running them in parallel workers would race each other.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    globalSetup: ["./tests/integration/globalSetup.ts"],
    fileParallelism: false,
    pool: "forks",
    testTimeout: 20000,
  },
});
