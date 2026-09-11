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
    // Vitest's default hookTimeout (10s) is too tight for this session's
    // observed Neon connectivity — a plain findFirstOrThrow() has timed
    // out at exactly 10s multiple times, purely from network latency, with
    // zero logic involved. Widening this doesn't hide real bugs (a broken
    // beforeAll still fails, just after a fairer wait) — see
    // docs/PROJECT_STATUS.md §5a for the full investigation.
    hookTimeout: 30000,
  },
});
