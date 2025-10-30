import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    return res
      .status(400)
      .json({ error: "ValidationError", details: err.flatten() });
  }
  const status = Number(err?.status) || 500;
  const code = err?.code || "InternalError";
  const message =
    status >= 500 ? "Internal Server Error" : err?.message || "Request failed";
  res.status(status).json({ error: code, message });
}
