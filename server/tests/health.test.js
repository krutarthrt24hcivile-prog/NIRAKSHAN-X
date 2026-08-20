import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
describe('platform health', () => { it('returns a live application status without exposing database credentials', async () => { const r = await request(app).get('/api/health'); expect([200, 503]).toContain(r.status); expect(r.body.success).toBe(true); expect(['ok', 'degraded']).toContain(r.body.data.status); expect(r.body.data).not.toHaveProperty('DATABASE_URL'); }); });
