import { config } from '../config.js';
import { logger } from '../logger.js';

let sentryMod: any = null;

export async function initSentry(): Promise<void> {
  if (!config.sentryDsn) {
    logger.info('Sentry DSN not set — error reporting disabled');
    return;
  }
  try {
    const mod: any = await import('@sentry/node');
    mod.init({
      dsn: config.sentryDsn,
      environment: config.nodeEnv,
      tracesSampleRate: config.isProd ? 0.05 : 1.0,
      release: process.env.SENTRY_RELEASE,
    });
    sentryMod = mod;
    logger.info('Sentry initialized');
  } catch (err) {
    logger.warn({ err: (err as Error).message }, '@sentry/node not installed — npm i @sentry/node');
  }
}

export function captureException(err: unknown, context?: Record<string, unknown>) {
  if (sentryMod) {
    try {
      sentryMod.captureException(err, { extra: context });
      return;
    } catch {
      // fallthrough
    }
  }
  logger.error({ err, ...context }, 'unhandled exception');
}
