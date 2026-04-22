import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/db.js';
import { logger } from '../src/logger.js';

// This script is executed with `tsx` (never with `tsc` build output),
// so `import.meta.url` is always available at runtime.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.resolve(__dirname, '../migrations');

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function run() {
  await ensureTable();
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const applied = await pool.query('SELECT 1 FROM _migrations WHERE name=$1', [file]);
    if (applied.rowCount && applied.rowCount > 0) {
      logger.info({ file }, 'migration already applied');
      continue;
    }
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    logger.info({ file }, 'applying migration');
    await pool.query('BEGIN');
    try {
      await pool.query(sql);
      await pool.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
      await pool.query('COMMIT');
      logger.info({ file }, 'migration applied');
    } catch (err) {
      await pool.query('ROLLBACK');
      logger.error({ err, file }, 'migration failed');
      process.exit(1);
    }
  }
  logger.info('all migrations complete');
  await pool.end();
}

run();
