import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next's own build-time typecheck step has been observed to OOM in
  // memory-constrained environments even when `tsc --noEmit` (run via
  // `npm run typecheck`) passes cleanly on its own with far less memory.
  // Typechecking is NOT skipped — it's just run as a separate, cheaper
  // step. CI/local workflows must run `npm run typecheck` before/alongside
  // `npm run build`; don't treat a green build alone as proof of type safety.
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
