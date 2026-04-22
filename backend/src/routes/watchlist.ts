import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../db.js';

export async function watchlistRoutes(app: FastifyInstance) {
  app.get('/me/watchlist', { onRequest: [app.authenticate] }, async (req) => {
    const res = await query<{
      commodity_id: number;
      alert_min: number | null;
      alert_max: number | null;
    }>(
      'SELECT commodity_id, alert_min, alert_max FROM watchlist WHERE user_id=$1 ORDER BY added_at ASC',
      [req.userId!],
    );
    return res.rows.map((r) => ({
      commodityId: r.commodity_id,
      alertMin: r.alert_min,
      alertMax: r.alert_max,
    }));
  });

  app.post('/me/watchlist', { onRequest: [app.authenticate] }, async (req, reply) => {
    const body = z
      .object({
        commodityId: z.number().int().positive(),
        alertMin: z.number().int().nullable().optional(),
        alertMax: z.number().int().nullable().optional(),
      })
      .parse(req.body);
    const exists = await query(
      'SELECT 1 FROM commodities WHERE id=$1',
      [body.commodityId],
    );
    if (exists.rows.length === 0) {
      reply.code(404);
      return { error: 'commodity not found' };
    }
    await query(
      `INSERT INTO watchlist (user_id, commodity_id, alert_min, alert_max)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, commodity_id)
       DO UPDATE SET alert_min = EXCLUDED.alert_min, alert_max = EXCLUDED.alert_max`,
      [req.userId!, body.commodityId, body.alertMin ?? null, body.alertMax ?? null],
    );
    return { ok: true };
  });

  app.delete('/me/watchlist/:commodityId', { onRequest: [app.authenticate] }, async (req) => {
    const { commodityId } = z
      .object({ commodityId: z.coerce.number().int().positive() })
      .parse(req.params);
    await query('DELETE FROM watchlist WHERE user_id=$1 AND commodity_id=$2', [
      req.userId!,
      commodityId,
    ]);
    return { ok: true };
  });

  app.put('/me/watchlist/bulk', { onRequest: [app.authenticate] }, async (req) => {
    const body = z.object({ commodityIds: z.array(z.number().int().positive()) }).parse(req.body);
    await query('DELETE FROM watchlist WHERE user_id=$1', [req.userId!]);
    if (body.commodityIds.length > 0) {
      const values = body.commodityIds
        .map((_, i) => `($1, $${i + 2})`)
        .join(',');
      await query(
        `INSERT INTO watchlist (user_id, commodity_id) VALUES ${values} ON CONFLICT DO NOTHING`,
        [req.userId!, ...body.commodityIds],
      );
    }
    return { ok: true, count: body.commodityIds.length };
  });
}
