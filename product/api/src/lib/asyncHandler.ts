import type { NextFunction, Request, Response } from "express";

type AsyncRouteHandler = (req: Request, res: Response) => Promise<void>;

// Express 4 doesn't await async handlers, so a rejected promise would
// otherwise crash the process instead of reaching errorHandler.
export function asyncHandler(handler: AsyncRouteHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res).catch(next);
  };
}
