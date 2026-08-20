import { Router } from 'express';
import { authenticate, officers } from '../middleware/auth.js';
import { asyncHandler, ok } from '../utils/http.js';
import { analyseProject } from '../services/ai.service.js';
const router=Router();router.post('/analyze-project/:id',authenticate,asyncHandler(async(req,res)=>ok(res,await analyseProject(req.params.id),'Project analysis completed')));export default router;
