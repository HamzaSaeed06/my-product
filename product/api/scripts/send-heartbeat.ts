// Manually-triggerable entry point for the heartbeat this deployment sends
// to its provider platform. See src/lib/heartbeatSender.ts for why this
// isn't wired to a real scheduler yet — usage:
//   npm run send-heartbeat --workspace=product/api

import "dotenv/config";
import { sendHeartbeat } from "../src/lib/heartbeatSender.js";
import { prisma } from "../src/lib/prisma.js";

sendHeartbeat()
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
