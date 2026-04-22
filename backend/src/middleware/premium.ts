import type { FastifyInstance } from 'fastify';
import { isPremium } from '../routes/subscriptions.js';

export function registerPremiumMiddleware(app: FastifyInstance) {
  app.decorate('requirePremium', async (req: any, reply: any) => {
    if (!req.userId) {
      reply.code(401).send({ error: 'unauthorized' });
      return;
    }
    const ok = await isPremium(req.userId);
    if (!ok) {
      reply.code(402).send({ error: 'premium_required' });
    }
  });
}

declare module 'fastify' {
  interface FastifyInstance {
    requirePremium: (req: any, reply: any) => Promise<void>;
  }
}
