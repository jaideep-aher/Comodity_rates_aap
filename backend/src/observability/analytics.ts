import { config } from '../config.js';
import { logger } from '../logger.js';
import { pool } from '../db.js';

let posthog: any = null;
let posthogInited = false;

async function initPosthog() {
  if (posthogInited) return posthog;
  posthogInited = true;
  if (!config.posthogKey) {
    logger.info('PostHog not configured — events logged locally only');
    return null;
  }
  try {
    const mod: any = await import('posthog-node');
    const PostHog = mod.PostHog ?? mod.default;
    posthog = new PostHog(config.posthogKey, { host: config.posthogHost });
    logger.info('PostHog initialized');
  } catch (err) {
    logger.warn({ err: (err as Error).message }, 'posthog-node not installed — npm i posthog-node');
  }
  return posthog;
}

export function trackEvent(
  userId: string | undefined,
  name: string,
  props: Record<string, unknown> = {},
): void {
  pool.query(
    'INSERT INTO events (user_id, name, props) VALUES ($1, $2, $3)',
    [userId ?? null, name, JSON.stringify(props)],
  ).catch(() => {});

  initPosthog().then((ph) => {
    if (!ph || !userId) return;
    try {
      ph.capture({ distinctId: userId, event: name, properties: props });
    } catch (err) {
      logger.debug({ err }, 'posthog capture failed');
    }
  });
}

export async function shutdownAnalytics() {
  if (posthog) {
    try { await posthog.shutdown(); } catch { /* noop */ }
  }
}
