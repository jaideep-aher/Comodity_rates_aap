import { request } from 'undici';
import * as cheerio from 'cheerio';
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
    maxRedirections: 5,
  });
  if (res.statusCode >= 300) {
    throw new Error(`HTTP ${res.statusCode} from ${url}`);
  }
  return await res.body.text();
}

/**
 * Given an apmcmumbai.org listing page, return the most recent /view-daily-bajarbhav/...
 * URL whose date is <= today. Returns null if nothing usable is found.
 */
function pickLatestDayUrl(listingHtml: string, viewSlug: string, origin: string): { url: string; date: string } | null {
  const $ = cheerio.load(listingHtml);
  const candidates: { url: string; date: string }[] = [];
  const todayIso = new Date().toISOString().slice(0, 10);
  $('a[href*="/view-daily-bajarbhav/"]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    // Expect patterns like /view-daily-bajarbhav/veg/2026-04-22
    const match = href.match(new RegExp(`/view-daily-bajarbhav/${viewSlug}/(\\d{4}-\\d{2}-\\d{2})`));
    if (!match) return;
    const date = match[1];
    if (date > todayIso) return; // skip future-dated placeholders
    const url = href.startsWith('http') ? href : `${origin}${href.startsWith('/') ? href : `/${href}`}`;
    candidates.push({ url, date });
  });
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return candidates[0];
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
  const byMarket: Record<string, number> = {};
  let total = 0;

  const runRes = await query<{ id: number }>(
    `INSERT INTO scrape_runs (source, status) VALUES ('all', 'running') RETURNING id`,
  );
  const runId = runRes.rows[0]?.id;

  try {
    for (const src of resolveSources()) {
      try {
        const listingHtml = await fetchHtml(src.listingUrl);
        const picked = pickLatestDayUrl(listingHtml, src.viewSlug, src.origin);
        if (!picked) {
          logger.warn(
            { listingUrl: src.listingUrl, market: src.market, category: src.category },
            'no daily-view link found on listing',
          );
          continue;
        }
        const dayHtml = await fetchHtml(picked.url);
        const rows = parsePriceTable(dayHtml, src.parser);
        if (rows.length === 0) {
          logger.warn(
            { url: picked.url, market: src.market, category: src.category },
            'parser returned 0 rows',
          );
        }
        const n = await ingestRows(src.market, src.category, rows, picked.date);
        byMarket[src.market] = (byMarket[src.market] ?? 0) + n;
        total += n;
        logger.info(
          {
            market: src.market,
            category: src.category,
            date: picked.date,
            rows: rows.length,
            ingested: n,
          },
          'scrape ok',
        );
      } catch (err) {
        logger.error({ err, market: src.market, category: src.category }, 'scrape source failed');
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
