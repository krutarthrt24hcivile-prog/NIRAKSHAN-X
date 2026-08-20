import { Router } from 'express';
import { IssueSeverity, IssueStatus, ProjectStatus } from '@prisma/client';
import { prisma } from '../utils/prisma.js';
import { asyncHandler, ok } from '../utils/http.js';
import { authenticate, officers } from '../middleware/auth.js';

const router = Router();
const active: ProjectStatus[] = [ProjectStatus.ON_TRACK, ProjectStatus.AT_RISK, ProjectStatus.CRITICAL];
router.get('/summary', asyncHandler(async (_req, res) => {
  const [totalProjects, onTrack, atRisk, critical, budget, activeProjects, completedProjects, issues, recentUpdates] = await Promise.all([
    prisma.project.count({ where: { publicVisible: true } }), prisma.project.count({ where: { publicVisible: true, status: ProjectStatus.ON_TRACK } }), prisma.project.count({ where: { publicVisible: true, status: ProjectStatus.AT_RISK } }), prisma.project.count({ where: { publicVisible: true, status: ProjectStatus.CRITICAL } }), prisma.project.aggregate({ where: { publicVisible: true }, _sum: { budget: true, spentAmount: true } }), prisma.project.count({ where: { status: { in: active } } }), prisma.project.count({ where: { status: ProjectStatus.COMPLETED } }), prisma.issue.count({ where: { status: { in: [IssueStatus.OPEN, IssueStatus.IN_PROGRESS] } } }), prisma.projectUpdate.findMany({ where: { isPublic: true, project: { publicVisible: true } }, take: 5, orderBy: { createdAt: 'desc' }, include: { project: { select: { id: true, name: true, projectCode: true } } } })
  ]);
  ok(res, { totalProjects, onTrack, atRisk, critical, totalBudget: Number(budget._sum.budget ?? 0), spentAmount: Number(budget._sum.spentAmount ?? 0), activeProjects, completedProjects, openIssues: issues, recentUpdates });
}));
router.get('/monitoring', authenticate, asyncHandler(async (_req, res) => {
  const [projects, issueCount, criticalIssues, upcoming] = await Promise.all([prisma.project.findMany({ select: { progress: true, status: true, budget: true, spentAmount: true } }), prisma.issue.count({ where: { status: { in: [IssueStatus.OPEN, IssueStatus.IN_PROGRESS] } } }), prisma.issue.count({ where: { severity: IssueSeverity.CRITICAL, status: { in: [IssueStatus.OPEN, IssueStatus.IN_PROGRESS] } } }), prisma.milestone.findMany({ where: { plannedDate: { gte: new Date() }, status: { not: 'COMPLETED' } }, take: 8, orderBy: { plannedDate: 'asc' }, include: { project: { select: { id: true, name: true } } } })]);
  const budget = projects.reduce((a, p) => a + Number(p.budget), 0), spent = projects.reduce((a, p) => a + Number(p.spentAmount), 0);
  ok(res, { totalProjects: projects.length, activeProjects: projects.filter(p => active.includes(p.status)).length, completedProjects: projects.filter(p => p.status === ProjectStatus.COMPLETED).length, delayedProjects: projects.filter(p => p.status === ProjectStatus.AT_RISK).length, criticalProjects: projects.filter(p => p.status === ProjectStatus.CRITICAL).length, averageProgress: projects.length ? Math.round(projects.reduce((a, p) => a + p.progress, 0) / projects.length) : 0, budgetUtilization: budget ? Math.round(spent / budget * 100) : 0, openIssues: issueCount, criticalIssues, upcomingMilestones: upcoming });
}));
export default router;
