import { Router } from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { config } from '../config.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { audit } from '../utils/audit.js';
import { ApiError, asyncHandler, ok } from '../utils/http.js';
import { prisma } from '../utils/prisma.js';

const router = Router();
const hash = (value: string) => crypto.createHash('sha256').update(value).digest('hex');
const cookieOptions: { httpOnly: true; secure: boolean; sameSite: 'none' | 'lax'; path: string } = { httpOnly: true, secure: config.isProduction, sameSite: config.isProduction ? 'none' : 'lax', path: '/' };
const signAccess = (user: { id: string; role: Role }) => jwt.sign({ sub: user.id, role: user.role, type: 'access' }, config.jwtSecret, { expiresIn: '15m' });
const signRefresh = (user: { id: string; role: Role }) => jwt.sign({ sub: user.id, role: user.role, type: 'refresh' }, config.refreshSecret, { expiresIn: '7d' });
const publicUser = (user: { id: string; name: string; email: string; role: Role }) => user;

async function createSession(res: any, user: { id: string; role: Role }) {
  const access = signAccess(user); const refresh = signRefresh(user);
  await prisma.refreshToken.create({ data: { userId: user.id, tokenHash: hash(refresh), expiresAt: new Date(Date.now() + 7 * 864e5) } });
  res.cookie('access_token', access, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie('refresh_token', refresh, { ...cookieOptions, maxAge: 7 * 864e5 });
}

router.post('/register', validate(z.object({ name: z.string().min(2).max(100), email: z.string().email(), password: z.string().min(12).max(128) })), asyncHandler(async (req, res) => {
  const exists = await prisma.user.findUnique({ where: { email: req.body.email.toLowerCase() } });
  if (exists) throw new ApiError(409, 'An account already exists for this email', 'EMAIL_IN_USE');
  const user = await prisma.user.create({ data: { name: req.body.name, email: req.body.email.toLowerCase(), passwordHash: await bcrypt.hash(req.body.password, 12), role: Role.PUBLIC_USER } });
  await audit({ userId: user.id, action: 'REGISTER', entity: 'User', entityId: user.id, ipAddress: req.ip });
  await createSession(res, user);
  ok(res, { user: publicUser(user) }, 'Registration completed', 201);
}));
router.post('/login', validate(z.object({ email: z.string().email(), password: z.string().min(1) })), asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.body.email.toLowerCase() } });
  if (!user || !user.active || !(await bcrypt.compare(req.body.password, user.passwordHash))) throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  await createSession(res, user); await audit({ userId: user.id, action: 'LOGIN', entity: 'User', entityId: user.id, ipAddress: req.ip });
  ok(res, { user: publicUser(user) }, 'Signed in successfully');
}));
router.post('/logout', asyncHandler(async (req, res) => {
  const refresh = req.cookies?.refresh_token; if (refresh) await prisma.refreshToken.deleteMany({ where: { tokenHash: hash(refresh) } });
  if (req.user) await audit({ userId: req.user.id, action: 'LOGOUT', entity: 'User', entityId: req.user.id, ipAddress: req.ip });
  res.clearCookie('access_token', cookieOptions).clearCookie('refresh_token', cookieOptions); ok(res, null, 'Signed out successfully');
}));
router.post('/refresh', asyncHandler(async (req, res) => {
  const refresh = req.cookies?.refresh_token; if (!refresh) throw new ApiError(401, 'Refresh token is required', 'UNAUTHENTICATED');
  const claims = jwt.verify(refresh, config.refreshSecret) as { sub: string; type: string }; if (claims.type !== 'refresh') throw new ApiError(401, 'Invalid refresh token', 'UNAUTHENTICATED');
  const token = await prisma.refreshToken.findUnique({ where: { tokenHash: hash(refresh) }, include: { user: true } });
  if (!token || token.expiresAt < new Date() || !token.user.active) throw new ApiError(401, 'Session expired', 'UNAUTHENTICATED');
  await prisma.refreshToken.delete({ where: { id: token.id } }); await createSession(res, token.user); ok(res, { user: publicUser(token.user) }, 'Session refreshed');
}));
router.get('/me', authenticate, asyncHandler(async (req, res) => ok(res, { user: req.user! })));
router.post('/forgot-password', validate(z.object({ email: z.string().email() })), asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.body.email.toLowerCase() } }); let developmentResetToken: string | undefined;
  if (user) { const raw = crypto.randomBytes(32).toString('hex'); developmentResetToken = config.isProduction ? undefined : raw; await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: hash(raw), expiresAt: new Date(Date.now() + 3600e3) } }); await audit({ userId: user.id, action: 'PASSWORD_RESET_REQUEST', entity: 'User', entityId: user.id, ipAddress: req.ip }); }
  ok(res, { ...(developmentResetToken ? { developmentResetToken } : {}) }, 'If the account exists, reset instructions have been initiated.');
}));
router.post('/reset-password', validate(z.object({ token: z.string().min(16), password: z.string().min(12).max(128) })), asyncHandler(async (req, res) => {
  const reset = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hash(req.body.token) } }); if (!reset || reset.usedAt || reset.expiresAt < new Date()) throw new ApiError(400, 'Reset token is invalid or expired', 'INVALID_RESET_TOKEN');
  await prisma.$transaction([prisma.user.update({ where: { id: reset.userId }, data: { passwordHash: await bcrypt.hash(req.body.password, 12) } }), prisma.passwordResetToken.update({ where: { id: reset.id }, data: { usedAt: new Date() } }), prisma.refreshToken.deleteMany({ where: { userId: reset.userId } })]);
  await audit({ userId: reset.userId, action: 'PASSWORD_RESET', entity: 'User', entityId: reset.userId, ipAddress: req.ip }); ok(res, null, 'Password reset successfully');
}));
export default router;
