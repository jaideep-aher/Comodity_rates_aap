import type { FastifyInstance } from 'fastify';
import { query } from '../db.js';
import { cached } from '../cache.js';

export async function marketRoutes(app: FastifyInstance) {
  app.get('/markets', async () => {
    return cached('markets:list', 300, async () => {
      const res = await query<{
        slug: string;
        name_mr: string;
        name_en: string;
        state: string;
        city: string;
        is_premium: boolean;
        enabled: boolean;
      }>(
        `SELECT slug, name_mr, name_en, state, city, is_premium, enabled
         FROM markets
         WHERE enabled = TRUE
         ORDER BY is_premium ASC, city ASC`,
      );
      return res.rows.map((r) => ({
        slug: r.slug,
        name: { mr: r.name_mr, en: r.name_en },
        state: r.state,
        city: r.city,
        isPremium: r.is_premium,
      }));
    });
  });
}
