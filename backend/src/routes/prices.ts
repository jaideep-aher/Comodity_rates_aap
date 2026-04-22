import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../db.js';
import { cached, cache } from '../cache.js';
import { config } from '../config.js';
import type { Category, PriceResponse } from '../types.js';

const TODAY_TTL = 60;
const DETAIL_TTL = 120;

type DbRow = {
  id: number;
  slug: string;
  name_mr: string;
  name_en: string;
  category: Category;
  icon_key: string;
  date: string;
  arrival_qtl: number;
  min_price: number;
  max_price: number;
  avg_price: number;
  prev_avg: number | null;
};

async function loadLatestPerCommodity(
  market: string,
  category?: Category,
): Promise<DbRow[]> {
  const params: any[] = [market];
  let where = '';
  if (category) {
    params.push(category);
    where = 'WHERE c.category = $2';
  }
  const sql = `
    WITH latest AS (
      SELECT DISTINCT ON (commodity_id) commodity_id, date, arrival_qtl, min_price, max_price, avg_price
      FROM price_snapshots
      WHERE market = $1
      ORDER BY commodity_id, date DESC
    ),
    prev AS (
      SELECT ps.commodity_id, ps.avg_price AS prev_avg
      FROM price_snapshots ps
      JOIN latest l ON l.commodity_id = ps.commodity_id
      WHERE ps.market = $1 AND ps.date = l.date - INTERVAL '1 day'
    )
    SELECT c.id, c.slug, c.name_mr, c.name_en, c.category, c.icon_key,
           l.date::text AS date, l.arrival_qtl, l.min_price, l.max_price, l.avg_price,
           p.prev_avg
    FROM commodities c
    LEFT JOIN latest l ON l.commodity_id = c.id
    LEFT JOIN prev p ON p.commodity_id = c.id
    ${where}
    ORDER BY c.category, c.id;
  `;
  const res = await query<DbRow>(sql, params);
  return res.rows;
}

async function loadSparks(
  market: string,
  commodityIds: number[],
): Promise<Record<number, number[]>> {
  if (commodityIds.length === 0) return {};
  const sql = `
    SELECT commodity_id, avg_price
    FROM (
      SELECT commodity_id, date, avg_price,
             ROW_NUMBER() OVER (PARTITION BY commodity_id ORDER BY date DESC) AS rn
      FROM price_snapshots
      WHERE commodity_id = ANY($1::int[])
        AND market = $2
    ) t
    WHERE rn <= 7
    ORDER BY commodity_id, date ASC;
  `;
  const res = await query<{ commodity_id: number; avg_price: number }>(sql, [commodityIds, market]);
  const out: Record<number, number[]> = {};
  for (const r of res.rows) {
    (out[r.commodity_id] ||= []).push(r.avg_price);
  }
  return out;
}

async function buildPriceResponse(
  market: string,
  category?: Category,
  ids?: number[],
): Promise<PriceResponse> {
  const rows = await loadLatestPerCommodity(market, category);
  let filtered = rows;
  if (ids && ids.length > 0) {
    const set = new Set(ids);
    filtered = rows.filter((r) => set.has(r.id));
  }

  const sparks = await loadSparks(market, filtered.map((r) => r.id));

  const freshestDate = filtered.reduce<string | null>(
    (acc, r) => (r.date && (!acc || r.date > acc) ? r.date : acc),
    null,
  );
  const stale =
    !freshestDate ||
    Date.now() - new Date(freshestDate + 'T00:00:00Z').getTime() > 36 * 60 * 60 * 1000;

  return {
    date: freshestDate ?? new Date().toISOString().slice(0, 10),
    stale,
    source: config.dataSource,
    items: filtered.map((r) => {
      const today = {
        date: r.date ?? new Date().toISOString().slice(0, 10),
        arrival: r.arrival_qtl ?? 0,
        min: r.min_price ?? 0,
        max: r.max_price ?? 0,
        avg: r.avg_price ?? 0,
      };
      const deltaPct =
        r.prev_avg && r.prev_avg > 0 && today.avg > 0
          ? ((today.avg - r.prev_avg) / r.prev_avg) * 100
          : 0;
      return {
        id: r.id,
        slug: r.slug,
        name: { mr: r.name_mr, en: r.name_en },
        category: r.category,
        iconKey: r.icon_key,
        today,
        deltaPct,
        spark: sparks[r.id] ?? [],
      };
    }),
  };
}

export async function priceRoutes(app: FastifyInstance) {
  app.get('/prices/today', async (req) => {
    const q = req.query as { category?: Category; ids?: string; market?: string };
    const category = q.category;
    const market = q.market || 'apmc_mumbai';
    const ids = q.ids
      ? q.ids.split(',').map((s) => Number(s)).filter((n) => Number.isFinite(n))
      : undefined;
    const cacheKey = `prices:today:${market}:${category ?? 'all'}:${ids ? ids.join(',') : 'all'}`;
    return cached(cacheKey, TODAY_TTL, () => buildPriceResponse(market, category, ids));
  });

  app.get('/prices/top-movers', async (req) => {
    const schema = z.object({
      kind: z.enum(['gainers', 'losers', 'arrivals']).default('gainers'),
      market: z.string().default('apmc_mumbai'),
    });
    const { kind, market } = schema.parse(req.query);
    const cacheKey = `prices:movers:${market}:${kind}`;
    return cached(cacheKey, TODAY_TTL, async () => {
      const res = await buildPriceResponse(market);
      const withPrice = res.items.filter((i) => i.today.avg > 0);
      const sorted = [...withPrice].sort((a, b) => {
        if (kind === 'arrivals') return b.today.arrival - a.today.arrival;
        if (kind === 'gainers') return b.deltaPct - a.deltaPct;
        return a.deltaPct - b.deltaPct;
      });
      return { ...res, items: sorted.slice(0, 10) };
    });
  });

  app.get('/commodity/:slug', async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const q = req.query as { market?: string; days?: string };
    const market = q.market || 'apmc_mumbai';
    const days = Math.max(7, Math.min(365, Number(q.days ?? 30)));
    return cached(`prices:detail:${market}:${slug}:${days}`, DETAIL_TTL, async () => {
      const c = await query<{ id: number; slug: string; name_mr: string; name_en: string; category: Category; icon_key: string }>(
        'SELECT id, slug, name_mr, name_en, category, icon_key FROM commodities WHERE slug=$1',
        [slug],
      );
      if (c.rows.length === 0) {
        reply.code(404);
        return { error: 'commodity not found' };
      }
      const row = c.rows[0];
      const hist = await query<{ date: string; arrival_qtl: number; min_price: number; max_price: number; avg_price: number }>(
        `SELECT date::text AS date, arrival_qtl, min_price, max_price, avg_price
         FROM price_snapshots
         WHERE commodity_id=$1 AND market=$2
         ORDER BY date DESC
         LIMIT $3`,
        [row.id, market, days],
      );
      const history = hist.rows.slice().reverse().map((h) => ({
        date: h.date,
        arrival: h.arrival_qtl,
        min: h.min_price,
        max: h.max_price,
        avg: h.avg_price,
      }));
      const today = history[history.length - 1] ?? null;
      const yesterday = history[history.length - 2] ?? null;
      const deltaPct =
        today && yesterday && yesterday.avg > 0 && today.avg > 0
          ? ((today.avg - yesterday.avg) / yesterday.avg) * 100
          : 0;
      const spark = history.slice(-7).map((h) => h.avg);
      return {
        id: row.id,
        slug: row.slug,
        name: { mr: row.name_mr, en: row.name_en },
        category: row.category,
        iconKey: row.icon_key,
        market,
        today,
        deltaPct,
        spark,
        history30d: history,
        history: history,
        source: config.dataSource,
      };
    });
  });

  // Multi-market comparison for a single commodity (premium feature).
  app.get('/commodity/:slug/markets', async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const c = await query<{ id: number }>('SELECT id FROM commodities WHERE slug=$1', [slug]);
    if (c.rows.length === 0) {
      reply.code(404);
      return { error: 'commodity not found' };
    }
    const rows = await query<{
      market: string;
      date: string;
      min_price: number;
      max_price: number;
      avg_price: number;
      arrival_qtl: number;
    }>(
      `SELECT DISTINCT ON (market)
         market, date::text AS date, min_price, max_price, avg_price, arrival_qtl
       FROM price_snapshots
       WHERE commodity_id=$1
       ORDER BY market, date DESC`,
      [c.rows[0].id],
    );
    return {
      slug,
      markets: rows.rows.map((r) => ({
        market: r.market,
        today: {
          date: r.date,
          min: r.min_price,
          max: r.max_price,
          avg: r.avg_price,
          arrival: r.arrival_qtl,
        },
      })),
      source: config.dataSource,
    };
  });
}

export async function invalidatePriceCaches() {
  await cache.delPrefix('prices:');
}
