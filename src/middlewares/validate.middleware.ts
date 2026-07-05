import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";
import { HttpError } from "../utils/http-error";

export function validateRequest<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(new HttpError(400, "Validation failed", result.error.flatten()));
    }

    req.body = result.data;
    return next();
  };
}
