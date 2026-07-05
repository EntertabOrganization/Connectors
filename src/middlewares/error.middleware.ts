import { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/http-error";
import { logger } from "../utils/logger";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const statusCode = error instanceof HttpError ? error.statusCode : 500;
  const details = error instanceof HttpError ? error.details : undefined;

  logger.error("request.failed", {
    requestId: req.requestId,
    message: error.message,
    stack: error.stack,
    details
  });

  res.status(statusCode).json({
    success: false,
    error: {
      message: error.message,
      details
    }
  });
}
