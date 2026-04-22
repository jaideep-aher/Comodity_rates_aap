import { logger } from '../logger.js';
import { config } from '../config.js';
import { query } from '../db.js';

export type PushMessage = {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  kind: 'daily_digest' | 'threshold' | 'spike' | 'advisory';
  dedupKey: string;
};

let fcmInitialized = false;
let fcmApp: any = null;

async function initFcm() {
  if (fcmInitialized) return fcmApp;
  fcmInitialized = true;
  if (!config.fcmServiceAccountJson) {
    logger.warn('FCM_SERVICE_ACCOUNT_JSON not set — push messages will be logged, not delivered.');
    return null;
  }
  try {
    const admin = await import('firebase-admin');
    const serviceAccount = JSON.parse(config.fcmServiceAccountJson);
    fcmApp = admin.default.initializeApp({
      credential: admin.default.credential.cert(serviceAccount),
    });
    logger.info('firebase-admin initialized');
    return fcmApp;
  } catch (err) {
    logger.error({ err }, 'firebase-admin init failed');
    return null;
  }
}

export async function sendPush(msg: PushMessage): Promise<{ delivered: number; skipped: number }> {
  const dedup = await query(
    'SELECT 1 FROM notifications_sent WHERE user_id=$1 AND dedup_key=$2',
    [msg.userId, msg.dedupKey],
  );
  if (dedup.rows.length > 0) {
    logger.debug({ userId: msg.userId, dedupKey: msg.dedupKey }, 'push deduped');
    return { delivered: 0, skipped: 1 };
  }

  const tokenRes = await query<{ fcm_token: string }>(
    'SELECT fcm_token FROM device_tokens WHERE user_id=$1',
    [msg.userId],
  );
  const tokens = tokenRes.rows.map((r) => r.fcm_token);

  let delivered = 0;
  if (tokens.length === 0) {
    logger.debug({ userId: msg.userId }, 'no device tokens — logging push only');
  } else {
    const app = await initFcm();
    if (!app) {
      logger.info(
        { userId: msg.userId, title: msg.title, body: msg.body, tokens: tokens.length },
        '[push simulated]',
      );
      delivered = tokens.length;
    } else {
      try {
        const admin = await import('firebase-admin');
        const res = await admin.default.messaging().sendEachForMulticast({
          tokens,
          notification: { title: msg.title, body: msg.body },
          data: msg.data,
          android: { priority: 'high' },
        });
        delivered = res.successCount;
        if (res.failureCount > 0) {
          logger.warn({ failures: res.responses.filter((r) => !r.success) }, 'some fcm sends failed');
        }
      } catch (err) {
        logger.error({ err }, 'fcm send failed');
      }
    }
  }

  await query(
    `INSERT INTO notifications_sent (user_id, kind, dedup_key, payload)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, dedup_key) DO NOTHING`,
    [msg.userId, msg.kind, msg.dedupKey, JSON.stringify({ title: msg.title, body: msg.body, data: msg.data ?? {} })],
  );

  return { delivered, skipped: 0 };
}
