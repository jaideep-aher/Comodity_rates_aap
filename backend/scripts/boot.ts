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

async function main() {
  try {
    await migrate();
  } catch (err) {
    process.stderr.write(`[boot] migrate error: ${err instanceof Error ? err.stack : String(err)}\n`);
    process.exit(1);
  }
  process.stdout.write('[boot] starting server...\n');
  await import('../src/index.js');
}

main().catch((err) => {
  process.stderr.write(`[boot] boot.ts crashed: ${err instanceof Error ? err.stack : String(err)}\n`);
  process.exit(1);
});
