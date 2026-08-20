import OpenAI from 'openai';
import { assessProject } from './risk.service.js';
import { prisma } from '../utils/prisma.js';

export async function analyseProject(projectId: string) {
  const deterministic = await assessProject(projectId);
  const project = await prisma.project.findUniqueOrThrow({ where: { id: projectId }, select: { name: true, progress: true, expectedCompletion: true, budget: true, spentAmount: true } });
  if (!process.env.OPENAI_API_KEY) return { provider: 'deterministic-risk-engine', externalProviderUsed: false, ...deterministic, summary: `${project.name} is currently assessed as ${deterministic.level.toLowerCase()} risk based on verified project data.` };
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', messages: [{ role: 'system', content: 'You are a concise public-infrastructure project adviser. Do not invent facts. Respond with a short risk summary and recommended actions.' }, { role: 'user', content: JSON.stringify({ project, deterministic }) }], temperature: 0.2, max_tokens: 350 });
    return { provider: 'openai-compatible', externalProviderUsed: true, ...deterministic, summary: completion.choices[0]?.message.content || 'No narrative analysis returned.' };
  } catch (error) {
    console.warn('AI provider failed; deterministic result retained', error instanceof Error ? error.message : error);
    return { provider: 'deterministic-risk-engine', externalProviderUsed: false, fallbackReason: 'Configured AI provider was unavailable.', ...deterministic, summary: `${project.name} is currently assessed as ${deterministic.level.toLowerCase()} risk by the deterministic risk engine.` };
  }
}
