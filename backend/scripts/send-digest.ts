import { runDailyDigest } from '../src/notifications/digest.js';
import { pool } from '../src/db.js';
import { logger } from '../src/logger.js';

async function main() {
  try {
    const n = await runDailyDigest();
    logger.info({ delivered: n }, 'digest done');
  } catch (err) {
    logger.error({ err }, 'digest failed');
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
