import type { Deployment } from "../generated/prisma/index.js";

export interface AuthenticatedProviderUser {
  id: string;
  sessionId: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      providerUser?: AuthenticatedProviderUser;
      heartbeatDeployment?: Deployment;
      rawBody?: Buffer;
    }
  }
}

export {};
