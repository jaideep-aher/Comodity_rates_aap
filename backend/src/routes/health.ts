import type { FastifyInstance } from 'fastify';
import { healthcheck } from '../db.js';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({ ok: true, time: new Date().toISOString() }));
  app.get('/health/db', async (_req, reply) => {
    const ok = await healthcheck();
    reply.code(ok ? 200 : 503);
    return { ok };
  });
}
