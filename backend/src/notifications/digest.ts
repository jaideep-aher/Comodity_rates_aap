import cron from 'node-cron';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { query } from '../db.js';
import { sendPush } from './sender.js';
import { sendSms } from './sms.js';
import { digestBody, digestTitle } from './templates.js';

let started = false;

export function startDigestCron() {
  if (started) return;
  started = true;
  logger.info({ cron: config.digestCron, tz: config.digestTimezone }, 'starting digest cron');
  cron.schedule(
    config.digestCron,
    async () => {
      logger.info('digest tick');
      try {
        const n = await runDailyDigest();
        logger.info({ delivered: n }, 'digest complete');
      } catch (err) {
        logger.error({ err }, 'digest failed');
      }
    },
    { timezone: config.digestTimezone },
  );
}

export async function runDailyDigest(): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const users = await query<{
    id: string;
    name: string | null;
    phone: string;
    language: 'mr' | 'en';
    sms_fallback: boolean;
  }>(
    `SELECT DISTINCT u.id, u.name, u.phone, u.language, u.sms_fallback
     FROM users u
     JOIN watchlist w ON w.user_id = u.id`,
  );

  let totalDelivered = 0;

  for (const u of users.rows) {
    const rowsRes = await query<{
      id: number;
      name_mr: string;
      name_en: string;
      avg: number;
      prev_avg: number | null;
    }>(
      `WITH latest AS (
         SELECT DISTINCT ON (ps.commodity_id) ps.commodity_id, ps.date, ps.avg_price
         FROM price_snapshots ps
         JOIN watchlist w ON w.commodity_id = ps.commodity_id
         WHERE w.user_id = $1 AND ps.market = 'apmc_mumbai' AND ps.avg_price > 0
         ORDER BY ps.commodity_id, ps.date DESC
       ),
       prev AS (
         SELECT ps.commodity_id, ps.avg_price AS prev_avg
         FROM price_snapshots ps
         JOIN latest l ON l.commodity_id = ps.commodity_id
         WHERE ps.date = l.date - INTERVAL '1 day'
       )
       SELECT c.id, c.name_mr, c.name_en, l.avg_price AS avg, p.prev_avg
       FROM latest l
       JOIN commodities c ON c.id = l.commodity_id
       LEFT JOIN prev p ON p.commodity_id = c.id
       ORDER BY
         CASE WHEN p.prev_avg > 0 THEN ABS(l.avg_price - p.prev_avg) / p.prev_avg ELSE 0 END DESC
       LIMIT 5`,
      [u.id],
    );

    const rows = rowsRes.rows.map((r) => ({
      name: { mr: r.name_mr, en: r.name_en },
      avg: r.avg,
      deltaPct:
        r.prev_avg && r.prev_avg > 0 && r.avg > 0
          ? ((r.avg - r.prev_avg) / r.prev_avg) * 100
          : 0,
    }));

    const title = digestTitle(u.language, u.name ?? '');
    const body = digestBody(u.language, rows);

    const res = await sendPush({
      userId: u.id,
      title,
      body,
      kind: 'daily_digest',
      dedupKey: `digest:${today}`,
      data: { route: 'home' },
    });
    totalDelivered += res.delivered;

    if (u.sms_fallback) {
      await sendSms({
        userId: u.id,
        phone: u.phone,
        body: `${title}\n${body}`,
        dedupKey: `digest:sms:${today}`,
      });
    }
  }

  return totalDelivered;
}
