import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { asyncHandler, ok } from '../utils/http.js';
import { validate } from '../middleware/validate.js';
const router = Router();
router.get('/projects', validate(z.object({ stateId: z.string().optional(), departmentId: z.string().optional(), status: z.enum(['ON_TRACK', 'AT_RISK', 'CRITICAL', 'COMPLETED']).optional() }), 'query'), asyncHandler(async (req, res) => {
  const { stateId, departmentId, status } = req.query as any;
  const projects = await prisma.project.findMany({ where: { publicVisible: true, ...(stateId ? { stateId } : {}), ...(departmentId ? { departmentId } : {}), ...(status ? { status } : {}) }, select: { id: true, projectCode: true, name: true, latitude: true, longitude: true, progress: true, status: true, riskScore: true, location: true, state: { select: { name: true } }, department: { select: { name: true } } } });
  ok(res, projects);
}));
export default router;
