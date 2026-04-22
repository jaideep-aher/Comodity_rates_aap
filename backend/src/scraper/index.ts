import { request } from 'undici';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { query, tx } from '../db.js';
import { parsePriceTable, type ParsedRow } from './parser.js';
import { findCommodity } from './commodityMap.js';
import { invalidatePriceCaches } from '../routes/prices.js';
import { runThresholdAlerts } from '../notifications/thresholds.js';
import { SOURCES, type MarketSlug, type ScrapeSource } from './sources.js';
import type { Category } from '../types.js';

async function fetchHtml(url: string): Promise<string> {
  const res = await request(url, {
    headers: {
      'User-Agent': config.scraperUserAgent,
      Accept: 'text/html,application/xhtml+xml',
    },
  });
  if (res.statusCode >= 300) {
    throw new Error(`HTTP ${res.statusCode} from ${url}`);
  }
  return await res.body.text();
}

async function ingestRows(
  market: MarketSlug,
  category: Category,
  rows: ParsedRow[],
  today: string,
): Promise<number> {
  let ingested = 0;
  await tx(async (client) => {
    for (const r of rows) {
      const c = await findCommodity(r.name_mr, category);
      if (!c) {
        logger.warn({ name: r.name_mr, category, market }, 'could not map commodity');
        continue;
      }
      await client.query(
        `INSERT INTO price_snapshots (commodity_id, market, date, arrival_qtl, min_price, max_price, avg_price)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (commodity_id, market, date)
         DO UPDATE SET
            arrival_qtl = EXCLUDED.arrival_qtl,
            min_price = EXCLUDED.min_price,
            max_price = EXCLUDED.max_price,
            avg_price = EXCLUDED.avg_price,
            scraped_at = NOW()`,
        [c.id, market, today, r.arrival, r.min, r.max, r.avg || Math.round((r.min + r.max) / 2)],
      );
      ingested++;
    }
  });
  return ingested;
}

function resolveSources(): ScrapeSource[] {
  const enabled = new Set(config.scraperMarkets);
  return SOURCES.filter((s) => enabled.has(s.market));
}

export async function runScrape(): Promise<{ total: number; byMarket: Record<string, number> }> {
  const today = new Date().toISOString().slice(0, 10);
  const byMarket: Record<string, number> = {};
  let total = 0;

  const runRes = await query<{ id: number }>(
    `INSERT INTO scrape_runs (source, status) VALUES ('all', 'running') RETURNING id`,
  );
  const runId = runRes.rows[0]?.id;

  try {
    for (const src of resolveSources()) {
      try {
        const html = await fetchHtml(src.url);
        const rows = parsePriceTable(html, src.parser);
        if (rows.length === 0) {
          logger.warn({ url: src.url, market: src.market }, 'parser returned 0 rows');
        }
        const n = await ingestRows(src.market, src.category, rows, today);
        byMarket[src.market] = (byMarket[src.market] ?? 0) + n;
        total += n;
        logger.info({ market: src.market, category: src.category, rows: rows.length, ingested: n }, 'scrape ok');
      } catch (err) {
        logger.error({ err, url: src.url, market: src.market }, 'scrape source failed');
      }
    }

    await query(
      `UPDATE scrape_runs SET finished_at=NOW(), status='success', rows_ingested=$1 WHERE id=$2`,
      [total, runId],
    );

    await invalidatePriceCaches();
    runThresholdAlerts().catch((err) =>
      logger.error({ err }, 'threshold alert pass failed'),
    );

    return { total, byMarket };
  } catch (err) {
    await query(
      `UPDATE scrape_runs SET finished_at=NOW(), status='failed', error=$1 WHERE id=$2`,
      [(err as Error).message, runId],
    );
    throw err;
  }
}
