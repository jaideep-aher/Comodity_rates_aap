import { Pool, type PoolConfig } from 'pg';
import { config } from './config.js';
import { logger } from './logger.js';

// Railway's internal hostname (postgres.railway.internal) uses plain TCP.
// Public proxies (rlwy.net) and most managed Postgres (Supabase, Neon,
// Fly) require SSL. Detect from the URL and enable it with a relaxed cert
// check — Railway's proxy uses a self-signed cert on a rotating chain.
function buildPoolConfig(): PoolConfig {
  const cfg: PoolConfig = {
    connectionString: config.databaseUrl,
    max: 10,
    idleTimeoutMillis: 30_000,
  };
  const url = config.databaseUrl;
  const needsSsl =
    !url.includes('.railway.internal') &&
    !url.includes('localhost') &&
    !url.includes('127.0.0.1');
  if (needsSsl) {
    cfg.ssl = { rejectUnauthorized: false };
  }
  return cfg;
}

export const pool = new Pool(buildPoolConfig());

pool.on('error', (err) => {
  logger.error({ err }, 'unexpected pg pool error');
});

export async function query<T = any>(
  text: string,
  params?: any[],
): Promise<{ rows: T[]; rowCount: number }> {
  const res = await pool.query(text, params);
  return { rows: res.rows as T[], rowCount: res.rowCount ?? 0 };
}

export async function tx<T>(fn: (client: any) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const out = await fn(client);
    await client.query('COMMIT');
    return out;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function healthcheck(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
