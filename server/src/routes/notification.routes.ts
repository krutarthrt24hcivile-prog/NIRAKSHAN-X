import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler, ok } from '../utils/http.js';
import { prisma } from '../utils/prisma.js';
const router=Router();router.use(authenticate);
router.get('/',asyncHandler(async(req,res)=>ok(res,await prisma.notification.findMany({where:{userId:req.user!.id},orderBy:{createdAt:'desc'},take:50}))));
router.patch('/:id/read',asyncHandler(async(req,res)=>{const n=await prisma.notification.updateMany({where:{id:req.params.id,userId:req.user!.id},data:{read:true}});ok(res,n,'Notification marked as read')}));
router.patch('/read-all',asyncHandler(async(req,res)=>{const n=await prisma.notification.updateMany({where:{userId:req.user!.id,read:false},data:{read:true}});ok(res,n,'Notifications marked as read')}));
export default router;
