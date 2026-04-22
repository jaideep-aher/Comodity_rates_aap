import { runScrape } from '../src/scraper/index.js';
import { pool } from '../src/db.js';
import { logger } from '../src/logger.js';

async function main() {
  try {
    const res = await runScrape();
    logger.info({ res }, 'scrape done');
  } catch (err) {
    logger.error({ err }, 'scrape failed');
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
