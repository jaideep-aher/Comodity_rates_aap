import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../db.js';

export async function deviceRoutes(app: FastifyInstance) {
  app.post('/me/device-token', { onRequest: [app.authenticate] }, async (req) => {
    const body = z
      .object({
        fcmToken: z.string().min(10),
        platform: z.enum(['android', 'ios', 'web']).default('android'),
      })
      .parse(req.body);
    await query(
      `INSERT INTO device_tokens (user_id, fcm_token, platform)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, fcm_token) DO UPDATE SET last_used = NOW()`,
      [req.userId!, body.fcmToken, body.platform],
    );
    return { ok: true };
  });

  app.delete('/me/device-token', { onRequest: [app.authenticate] }, async (req) => {
    const body = z.object({ fcmToken: z.string().min(10) }).parse(req.body);
    await query('DELETE FROM device_tokens WHERE user_id=$1 AND fcm_token=$2', [
      req.userId!,
      body.fcmToken,
    ]);
    return { ok: true };
  });
}
