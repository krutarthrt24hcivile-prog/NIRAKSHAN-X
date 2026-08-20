import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { config } from '../config.js';
import { ApiError } from '../utils/http.js';
import { prisma } from '../utils/prisma.js';

type Claims = { sub: string; role: Role; type: 'access' | 'refresh' };

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.header('authorization');
    const token = req.cookies?.access_token || (header?.startsWith('Bearer ') ? header.slice(7) : undefined);
    if (!token) throw new ApiError(401, 'Authentication is required', 'UNAUTHENTICATED');
    const claims = jwt.verify(token, config.jwtSecret) as Claims;
    if (claims.type !== 'access') throw new ApiError(401, 'Invalid access token', 'UNAUTHENTICATED');
    const user = await prisma.user.findUnique({ where: { id: claims.sub }, select: { id: true, name: true, email: true, role: true, active: true } });
    if (!user || !user.active) throw new ApiError(401, 'Account is unavailable', 'ACCOUNT_UNAVAILABLE');
    req.user = user;
    next();
  } catch (error) { next(error instanceof ApiError ? error : new ApiError(401, 'Invalid or expired session', 'UNAUTHENTICATED')); }
}

export const allow = (...roles: Role[]) => (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) return next(new ApiError(401, 'Authentication is required', 'UNAUTHENTICATED'));
  if (!roles.includes(req.user.role)) return next(new ApiError(403, 'You do not have permission for this action', 'FORBIDDEN'));
  next();
};

export const officers: Role[] = [Role.SUPER_ADMIN, Role.ADMIN, Role.MINISTRY_OFFICER, Role.STATE_OFFICER, Role.DISTRICT_OFFICER, Role.INSPECTOR];
