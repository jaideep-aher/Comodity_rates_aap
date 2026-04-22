import cron from 'node-cron';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { runScrape } from './index.js';

let started = false;

export function startScraperCron() {
  if (started) return;
  started = true;
  logger.info({ cron: config.scraperCron }, 'starting scraper cron');
  cron.schedule(
    config.scraperCron,
    async () => {
      logger.info('scrape tick');
      try {
        const res = await runScrape();
        logger.info({ res }, 'scrape finished');
      } catch (err) {
        logger.error({ err }, 'scrape failed');
      }
    },
    { timezone: 'Asia/Kolkata' },
  );

  // Warm up on boot if DB is empty so we have something to serve.
  setTimeout(() => {
    runScrape()
      .then((res) => logger.info({ res }, 'boot scrape ok'))
      .catch((err) => logger.error({ err }, 'boot scrape failed'));
  }, 5_000);
}
