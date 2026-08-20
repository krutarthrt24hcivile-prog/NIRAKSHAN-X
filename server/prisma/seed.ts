import { PrismaClient, ProjectStatus, IssueSeverity, IssueStatus, MilestoneStatus, Role, GrievancePriority, GrievanceStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const stateData = [
  ['Maharashtra', 'MH', 'Mumbai'], ['Uttar Pradesh', 'UP', 'Lucknow'], ['Delhi', 'DL', 'New Delhi'],
  ['Odisha', 'OD', 'Bhubaneswar'], ['Tamil Nadu', 'TN', 'Chennai'], ['Karnataka', 'KA', 'Bengaluru'],
  ['Gujarat', 'GJ', 'Ahmedabad'], ['West Bengal', 'WB', 'Kolkata'], ['Rajasthan', 'RJ', 'Jaipur'], ['Assam', 'AS', 'Guwahati']
] as const;
const coordinates = [[19.076,72.878],[26.8467,80.9462],[28.6139,77.209],[20.2961,85.8245],[13.0827,80.2707],[12.9716,77.5946],[23.0225,72.5714],[22.5726,88.3639],[26.9124,75.7873],[26.1445,91.7362]];

async function main() {
  const passwordHash = await bcrypt.hash('ChangeMe!2026', 12);
  const admin = await prisma.user.upsert({ where: { email: 'admin@nirikshan.gov.in' }, update: {}, create: { name: 'Admin Officer', email: 'admin@nirikshan.gov.in', passwordHash, role: Role.SUPER_ADMIN } });
  const inspector = await prisma.user.upsert({ where: { email: 'inspector@nirikshan.gov.in' }, update: {}, create: { name: 'Field Inspector', email: 'inspector@nirikshan.gov.in', passwordHash, role: Role.INSPECTOR } });
  const ministry = await prisma.ministry.upsert({ where: { code: 'MOSPI' }, update: {}, create: { code: 'MOSPI', name: 'Ministry of Statistics & Programme Implementation' } });
  const roads = await prisma.department.upsert({ where: { code: 'MORTH' }, update: {}, create: { code: 'MORTH', name: 'Road Transport & Highways', ministryId: ministry.id } });
  const water = await prisma.department.upsert({ where: { code: 'JAL' }, update: {}, create: { code: 'JAL', name: 'Department of Drinking Water & Sanitation', ministryId: ministry.id } });
  const scheme = await prisma.scheme.upsert({ where: { code: 'BHARAT' }, update: {}, create: { code: 'BHARAT', name: 'Bharatmala Pariyojana', departmentId: roads.id } });
  const states = await Promise.all(stateData.map(async ([name, code, district]) => {
    const state = await prisma.state.upsert({ where: { code }, update: {}, create: { name, code } });
    const dist = await prisma.district.upsert({ where: { stateId_name: { stateId: state.id, name: district } }, update: {}, create: { stateId: state.id, name: district } });
    return { state, dist };
  }));
  const existing = await prisma.project.count();
  if (!existing) {
    for (let i = 0; i < 50; i++) {
      const at = i % states.length; const { state, dist } = states[at]; const isRoad = i % 2 === 0;
      const progress = (i * 17) % 96; const status = progress < 30 && i % 3 === 0 ? ProjectStatus.CRITICAL : (i % 4 === 0 ? ProjectStatus.AT_RISK : ProjectStatus.ON_TRACK);
      const project = await prisma.project.create({ data: { projectCode: `NXR-2026-${String(i + 1).padStart(4, '0')}`, name: `${isRoad ? 'National Infrastructure Corridor' : 'Rural Water Supply Scheme'} ${i + 1}`, description: `Government infrastructure project serving ${dist.name}, ${state.name}.`, location: `${dist.name}, ${state.name}`, latitude: coordinates[at][0] + (i % 5) * 0.08, longitude: coordinates[at][1] + (i % 3) * 0.08, budget: 120000000 + i * 5000000, spentAmount: Math.round((120000000 + i * 5000000) * progress / 100), contractor: `National Works Agency ${i % 8 + 1}`, startDate: new Date(2024, i % 12, 1), expectedCompletion: new Date(2027, i % 12, 1), progress, status, riskScore: status === ProjectStatus.CRITICAL ? 84 : status === ProjectStatus.AT_RISK ? 57 : 22, riskLevel: status === ProjectStatus.CRITICAL ? 'CRITICAL' : status === ProjectStatus.AT_RISK ? 'MEDIUM' : 'LOW', ministryId: ministry.id, departmentId: isRoad ? roads.id : water.id, schemeId: isRoad ? scheme.id : null, stateId: state.id, districtId: dist.id, createdById: admin.id } });
      await prisma.milestone.createMany({ data: [{ projectId: project.id, name: 'Foundation and approvals', plannedDate: new Date(2025, 2, 1), actualDate: progress > 25 ? new Date(2025, 2, 12) : null, progress: Math.min(progress * 3, 100), status: progress > 25 ? MilestoneStatus.COMPLETED : MilestoneStatus.IN_PROGRESS }, { projectId: project.id, name: 'Phase one delivery', plannedDate: new Date(2026, 8, 1), progress, status: status === ProjectStatus.CRITICAL ? MilestoneStatus.DELAYED : MilestoneStatus.IN_PROGRESS }] });
      await prisma.projectUpdate.create({ data: { projectId: project.id, authorId: inspector.id, progress, message: `Field monitoring update: work progress recorded at ${progress}%.`, isPublic: true } });
      if (status !== ProjectStatus.ON_TRACK) await prisma.issue.create({ data: { projectId: project.id, title: status === ProjectStatus.CRITICAL ? 'Critical schedule variance' : 'Schedule monitoring required', description: 'Field monitoring identified a variance requiring officer attention.', category: 'Schedule', severity: status === ProjectStatus.CRITICAL ? IssueSeverity.CRITICAL : IssueSeverity.MEDIUM, status: IssueStatus.OPEN, reportedById: inspector.id } });
    }
  }
  await prisma.grievance.upsert({ where: { trackingId: 'NXR-2026-000001' }, update: {}, create: { trackingId: 'NXR-2026-000001', name: 'Citizen Applicant', email: 'citizen@example.in', phone: '9000000000', subject: 'Request for project update', description: 'Please share the public timeline for the local project.', category: 'Information', priority: GrievancePriority.MEDIUM, status: GrievanceStatus.UNDER_REVIEW } });
  console.log('Seed complete. Development admin: admin@nirikshan.gov.in / ChangeMe!2026');
}

main().finally(() => prisma.$disconnect());
