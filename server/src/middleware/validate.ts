import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

export const validate = (schema: ZodTypeAny, key: 'body' | 'query' | 'params' = 'body') => (req: Request, _res: Response, next: NextFunction) => {
  const result = schema.safeParse(req[key]);
  if (!result.success) return next(result.error);
  (req as any)[key] = result.data;
  next();
};
