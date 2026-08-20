import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export class ApiError extends Error {
  constructor(public status: number, message: string, public code = 'REQUEST_ERROR') { super(message); }
}
export const ok = <T>(res: Response, data: T, message = 'Success', status = 200) => res.status(status).json({ success: true, data, message });
// Route parameter values are normalised by Express at runtime. `any` here avoids
// Express 5's overly broad string|string[] inference leaking into every handler.
export const asyncHandler = (fn: (req: Request<any, any, any, any>, res: Response, next: NextFunction) => Promise<unknown>) => (req: Request<any, any, any, any>, res: Response, next: NextFunction) => Promise.resolve(fn(req, res, next)).catch(next);
export const notFound = (_req: Request, _res: Response, next: NextFunction) => next(new ApiError(404, 'Resource not found', 'NOT_FOUND'));
export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) return res.status(400).json({ success: false, message: 'Validation failed', error: 'VALIDATION_ERROR', details: err.flatten() });
  if (err instanceof ApiError) return res.status(err.status).json({ success: false, message: err.message, error: err.code });
  console.error(err);
  return res.status(500).json({ success: false, message: 'An unexpected error occurred', error: 'INTERNAL_ERROR' });
};
