import { MilestoneStatus, IssueSeverity, IssueStatus, ProjectStatus } from '@prisma/client';
import { prisma } from '../utils/prisma.js';

export type RiskResult = { score: number; level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; factors: string[]; recommendations: string[]; status: ProjectStatus };

export async function assessProject(projectId: string): Promise<RiskResult> {
  const project = await prisma.project.findUniqueOrThrow({ where: { id: projectId }, include: { milestones: true, issues: true } });
  let score = 0; const factors: string[] = [];
  const today = new Date(); const totalDuration = project.expectedCompletion.getTime() - project.startDate.getTime(); const elapsed = Math.max(0, today.getTime() - project.startDate.getTime());
  const plannedProgress = Math.min(100, Math.round((elapsed / Math.max(totalDuration, 1)) * 100));
  if (today > project.expectedCompletion && project.progress < 100) { score += 30; factors.push('Expected completion date has passed'); }
  else if (project.progress + 15 < plannedProgress) { score += 18; factors.push(`Progress is ${plannedProgress - project.progress}% below schedule`); }
  const delayed = project.milestones.filter(m => m.status === MilestoneStatus.DELAYED || (!m.actualDate && m.plannedDate < today && m.status !== MilestoneStatus.COMPLETED));
  if (delayed.length) { score += Math.min(20, delayed.length * 8); factors.push(`${delayed.length} milestone(s) delayed`); }
  const terminalIssueStatuses: IssueStatus[] = [IssueStatus.RESOLVED, IssueStatus.CLOSED];
  const open = project.issues.filter(i => !terminalIssueStatuses.includes(i.status));
  const critical = open.filter(i => i.severity === IssueSeverity.CRITICAL).length;
  if (open.length) { score += Math.min(14, open.length * 3); factors.push(`${open.length} open issue(s)`); }
  if (critical) { score += Math.min(28, critical * 14); factors.push(`${critical} critical issue(s) open`); }
  const budget = Number(project.budget); const spent = Number(project.spentAmount); const utilisation = budget > 0 ? spent / budget : 0;
  if (utilisation > Math.max(.1, project.progress / 100 + .22)) { score += 14; factors.push('Budget utilisation is ahead of physical progress'); }
  score = Math.min(100, score);
  const level = score <= 30 ? 'LOW' : score <= 60 ? 'MEDIUM' : score <= 80 ? 'HIGH' : 'CRITICAL';
  const status = project.progress === 100 || project.actualCompletion ? ProjectStatus.COMPLETED : score > 80 ? ProjectStatus.CRITICAL : score > 40 ? ProjectStatus.AT_RISK : ProjectStatus.ON_TRACK;
  const recommendations = [
    ...(delayed.length ? ['Escalate delayed milestones and recover the delivery schedule.'] : []),
    ...(critical ? ['Assign a senior officer to critical issues within one working day.'] : []),
    ...(utilisation > project.progress / 100 + .22 ? ['Review expenditure against verified physical progress.'] : []),
    ...(factors.length === 0 ? ['Continue regular field verification and milestone updates.'] : [])
  ];
  return { score, level, factors, recommendations, status };
}

export async function recalculateProject(projectId: string) {
  const risk = await assessProject(projectId);
  const current = await prisma.project.findUniqueOrThrow({ where: { id: projectId }, select: { manualStatusOverride: true } });
  return prisma.project.update({ where: { id: projectId }, data: { riskScore: risk.score, riskLevel: risk.level, status: current.manualStatusOverride ?? risk.status } });
}
