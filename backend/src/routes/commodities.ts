import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../db.js';
import { cached } from '../cache.js';
import type { Category } from '../types.js';

export async function commodityRoutes(app: FastifyInstance) {
  app.get('/commodities', async (req) => {
    const schema = z.object({ category: z.enum(['veg', 'fruit', 'grain', 'turbhe']).optional() });
    const { category } = schema.parse(req.query);
    return cached(`commodities:${category ?? 'all'}`, 3600, async () => {
      const params: any[] = [];
      let where = '';
      if (category) {
        params.push(category);
        where = 'WHERE category = $1';
      }
      const res = await query<{
        id: number;
        slug: string;
        name_mr: string;
        name_en: string;
        category: Category;
        icon_key: string;
        unit: string;
      }>(
        `SELECT id, slug, name_mr, name_en, category, icon_key, unit
         FROM commodities ${where}
         ORDER BY category, id`,
        params,
      );
      return res.rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        name: { mr: r.name_mr, en: r.name_en },
        category: r.category,
        iconKey: r.icon_key,
        unit: r.unit,
      }));
    });
  });
}
