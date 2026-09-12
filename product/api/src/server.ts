import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { startHeartbeatScheduler, stopHeartbeatScheduler } from "./lib/heartbeatScheduler.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`product/api listening on port ${env.PORT} (${env.NODE_ENV})`);
  startHeartbeatScheduler();
});

function shutdown(signal: string) {
  console.log(`${signal} received, shutting down gracefully`);
  stopHeartbeatScheduler();
  server.close(() => process.exit(0));
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
