import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { asyncHandler, ok } from '../utils/http.js';
import { prisma } from '../utils/prisma.js';
const router=Router();
router.get('/projects',validate(z.object({q:z.string().min(1).max(100),page:z.coerce.number().int().positive().default(1),limit:z.coerce.number().int().min(1).max(50).default(10)}),'query'),asyncHandler(async(req,res)=>{const {q,page,limit}=req.query as any;const where={publicVisible:true,OR:[{projectCode:{contains:q,mode:'insensitive' as const}},{name:{contains:q,mode:'insensitive' as const}},{location:{contains:q,mode:'insensitive' as const}},{state:{name:{contains:q,mode:'insensitive' as const}}},{district:{name:{contains:q,mode:'insensitive' as const}}},{department:{name:{contains:q,mode:'insensitive' as const}}},{ministry:{name:{contains:q,mode:'insensitive' as const}}},{scheme:{name:{contains:q,mode:'insensitive' as const}}}]};const[items,total]=await Promise.all([prisma.project.findMany({where,select:{id:true,projectCode:true,name:true,location:true,progress:true,status:true,state:{select:{name:true}},department:{select:{name:true}}},take:limit,skip:(page-1)*limit,orderBy:{updatedAt:'desc'}}),prisma.project.count({where})]);ok(res,{items,pagination:{page,limit,total,pages:Math.ceil(total/limit)}})}));
export default router;
