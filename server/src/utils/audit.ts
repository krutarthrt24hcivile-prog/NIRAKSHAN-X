import { Prisma } from '@prisma/client';
import { prisma } from './prisma.js';

export async function audit(input: { userId?: string; action: string; entity: string; entityId: string; oldValue?: object | null; newValue?: object | null; ipAddress?: string }) {
  return prisma.auditLog.create({ data: input as Prisma.AuditLogUncheckedCreateInput });
}
