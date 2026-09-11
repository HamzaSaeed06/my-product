import express, { type Express } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { authRouter } from "./modules/auth/routes.js";
import { customersRouter } from "./modules/customers/routes.js";
import { plansRouter } from "./modules/plans/routes.js";
import { deploymentsRouter } from "./modules/deployments/routes.js";
import { licensesRouter } from "./modules/licenses/routes.js";
import { heartbeatRouter } from "./modules/health/routes.js";
import { supportRouter } from "./modules/support/routes.js";
import { dashboardRouter } from "./modules/dashboard/routes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { readRateLimiter } from "./middleware/rateLimiter.js";

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.PROVIDER_WEB_ORIGIN,
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(
    express.json({
      limit: "1mb",
      verify: (req, _res, buf) => {
        (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
      },
    })
  );
  app.use(readRateLimiter);

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/customers", customersRouter);
  app.use("/api/v1/plans", plansRouter);
  app.use("/api/v1/deployments", deploymentsRouter);
  app.use("/api/v1/licenses", licensesRouter);
  app.use("/api/v1/heartbeat", heartbeatRouter);
  app.use("/api/v1/support-tickets", supportRouter);
  app.use("/api/v1/dashboard", dashboardRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
