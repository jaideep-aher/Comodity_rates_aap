import { logger } from '../logger.js';
import { query } from '../db.js';
import { sendPush } from './sender.js';
import { spikeBody, spikeTitle, thresholdBody, thresholdTitle } from './templates.js';

const SPIKE_PCT = 15;

type Candidate = {
  user_id: string;
  commodity_id: number;
  name_mr: string;
  name_en: string;
  language: 'mr' | 'en';
  avg: number;
  prev_avg: number | null;
  alert_min: number | null;
  alert_max: number | null;
  date: string;
};

export async function runThresholdAlerts(): Promise<{ delivered: number }> {
  const res = await query<Candidate>(
    `WITH latest AS (
       SELECT DISTINCT ON (commodity_id) commodity_id, date, avg_price
       FROM price_snapshots
       WHERE market = 'apmc_mumbai'
       ORDER BY commodity_id, date DESC
     ),
     prev AS (
       SELECT ps.commodity_id, ps.avg_price AS prev_avg
       FROM price_snapshots ps
       JOIN latest l ON l.commodity_id = ps.commodity_id
       WHERE ps.date = l.date - INTERVAL '1 day'
     )
     SELECT w.user_id, w.commodity_id,
            c.name_mr, c.name_en, u.language,
            l.avg_price AS avg, p.prev_avg,
            w.alert_min, w.alert_max,
            l.date::text AS date
     FROM watchlist w
     JOIN users u ON u.id = w.user_id
     JOIN commodities c ON c.id = w.commodity_id
     JOIN latest l ON l.commodity_id = w.commodity_id
     LEFT JOIN prev p ON p.commodity_id = w.commodity_id
     WHERE l.avg_price > 0`,
  );

  let delivered = 0;

  for (const row of res.rows) {
    const avg = row.avg;
    const name = row.language === 'mr' ? row.name_mr : row.name_en;

    if (row.alert_max != null && avg >= row.alert_max) {
      const dedup = `threshold:max:${row.commodity_id}:${row.date}`;
      const push = await sendPush({
        userId: row.user_id,
        title: thresholdTitle(row.language, name),
        body: thresholdBody(row.language, name, avg, 'above', row.alert_max),
        kind: 'threshold',
        dedupKey: dedup,
        data: { route: 'detail', commodityId: String(row.commodity_id) },
      });
      delivered += push.delivered;
    }

    if (row.alert_min != null && avg <= row.alert_min) {
      const dedup = `threshold:min:${row.commodity_id}:${row.date}`;
      const push = await sendPush({
        userId: row.user_id,
        title: thresholdTitle(row.language, name),
        body: thresholdBody(row.language, name, avg, 'below', row.alert_min),
        kind: 'threshold',
        dedupKey: dedup,
        data: { route: 'detail', commodityId: String(row.commodity_id) },
      });
      delivered += push.delivered;
    }

    if (row.prev_avg && row.prev_avg > 0) {
      const deltaPct = ((avg - row.prev_avg) / row.prev_avg) * 100;
      if (Math.abs(deltaPct) >= SPIKE_PCT) {
        const dedup = `spike:${row.commodity_id}:${row.date}`;
        const push = await sendPush({
          userId: row.user_id,
          title: spikeTitle(row.language, name, deltaPct),
          body: spikeBody(row.language, name, avg),
          kind: 'spike',
          dedupKey: dedup,
          data: { route: 'detail', commodityId: String(row.commodity_id) },
        });
        delivered += push.delivered;
      }
    }
  }

  logger.info({ delivered, candidates: res.rows.length }, 'threshold alerts pass');
  return { delivered };
}
