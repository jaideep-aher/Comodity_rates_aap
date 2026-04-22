import { pool } from '../src/db.js';
import { COMMODITIES } from '../src/data/commodities.js';
import { logger } from '../src/logger.js';

async function run() {
  logger.info({ count: COMMODITIES.length }, 'seeding commodities');
  for (const c of COMMODITIES) {
    await pool.query(
      `INSERT INTO commodities (slug, name_mr, name_en, category, icon_key)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (slug) DO UPDATE SET
          name_mr = EXCLUDED.name_mr,
          name_en = EXCLUDED.name_en,
          category = EXCLUDED.category,
          icon_key = EXCLUDED.icon_key,
          updated_at = NOW()`,
      [c.slug, c.name_mr, c.name_en, c.category, c.icon_key],
    );
  }
  logger.info('seed complete');
  await pool.end();
}

run().catch((err) => {
  logger.error({ err }, 'seed failed');
  process.exit(1);
});
