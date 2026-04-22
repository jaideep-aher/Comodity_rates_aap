process.stdout.write('[boot] boot.ts start\n');

import fs from 'node:fs';
import path from 'node:path';
import { pool } from '../src/db.js';

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'migrations');

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function migrate() {
  await ensureTable();
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const applied = await pool.query('SELECT 1 FROM _migrations WHERE name=$1', [file]);
    if (applied.rowCount && applied.rowCount > 0) {
      process.stdout.write(`[boot] migration already applied: ${file}\n`);
      continue;
    }
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    process.stdout.write(`[boot] applying migration: ${file}\n`);
    await pool.query('BEGIN');
    try {
      await pool.query(sql);
      await pool.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
      await pool.query('COMMIT');
      process.stdout.write(`[boot] applied: ${file}\n`);
    } catch (err) {
      await pool.query('ROLLBACK');
      process.stderr.write(`[boot] migration failed on ${file}: ${err instanceof Error ? err.stack : String(err)}\n`);
      process.exit(1);
    }
  }
  process.stdout.write('[boot] all migrations complete\n');
}

async function seedCommodities() {
  const { COMMODITIES } = await import('../src/data/commodities.js');
  process.stdout.write(`[boot] seeding ${COMMODITIES.length} commodities...\n`);
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
  process.stdout.write('[boot] commodities seeded\n');
}

async function initialScrapeIfEmpty() {
  try {
    const res = await pool.query('SELECT COUNT(*)::int AS n FROM price_snapshots');
    const n = res.rows[0]?.n ?? 0;
    if (n > 0) {
      process.stdout.write(`[boot] price_snapshots has ${n} rows, skipping initial scrape\n`);
      return;
    }
    process.stdout.write('[boot] price_snapshots empty, kicking off initial scrape (non-blocking)\n');
    const { runScrape } = await import('../src/scraper/index.js');
    runScrape()
      .then((r) => process.stdout.write(`[boot] initial scrape done: ${JSON.stringify(r)}\n`))
      .catch((err) =>
        process.stderr.write(
          `[boot] initial scrape failed: ${err instanceof Error ? err.stack : String(err)}\n`,
        ),
      );
  } catch (err) {
    process.stderr.write(
      `[boot] initialScrapeIfEmpty error: ${err instanceof Error ? err.stack : String(err)}\n`,
    );
  }
}

async function main() {
  try {
    await migrate();
    await seedCommodities();
  } catch (err) {
    process.stderr.write(`[boot] migrate/seed error: ${err instanceof Error ? err.stack : String(err)}\n`);
    process.exit(1);
  }
  process.stdout.write('[boot] starting server...\n');
  await import('../src/index.js');
  await initialScrapeIfEmpty();
}

main().catch((err) => {
  process.stderr.write(`[boot] boot.ts crashed: ${err instanceof Error ? err.stack : String(err)}\n`);
  process.exit(1);
});
