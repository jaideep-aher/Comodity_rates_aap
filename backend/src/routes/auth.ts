import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requestOtp, verifyOtp } from '../auth.js';
import { config } from '../config.js';
import { query } from '../db.js';

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/otp/send', async (req, reply) => {
    const body = z.object({ phone: z.string().min(6) }).parse(req.body);
    try {
      const result = await requestOtp(body.phone);
      return { sent: true, devCode: result.devCode };
    } catch (err) {
      reply.code(400);
      return { error: (err as Error).message };
    }
  });

  app.post('/auth/otp/verify', async (req, reply) => {
    let phone: string;
    let code: string;
    if (config.otpVerificationEnabled) {
      const b = z
        .object({
          phone: z.string().min(6),
          code: z.string().min(4).max(8),
        })
        .parse(req.body);
      phone = b.phone;
      code = b.code;
    } else {
      const b = z
        .object({
          phone: z.string().min(6),
          code: z.string().max(8).optional(),
        })
        .parse(req.body);
      phone = b.phone;
      code = b.code ?? '';
    }

    try {
      const { user, isNew } = await verifyOtp(phone, code);
      const token = await reply.jwtSign({ sub: user.id }, { expiresIn: '90d' });
      return { token, user, isNew };
    } catch (err) {
      reply.code(400);
      return { error: (err as Error).message };
    }
  });

  app.get('/me', { onRequest: [app.authenticate] }, async (req, reply) => {
    const id = req.userId!;
    const res = await query<{
      id: string;
      phone: string;
      name: string | null;
      village: string | null;
      village_id: string | null;
      district: string | null;
      language: 'mr' | 'en';
      latitude: number | null;
      longitude: number | null;
    }>(
      'SELECT id, phone, name, village, village_id, district, language, latitude, longitude FROM users WHERE id=$1',
      [id],
    );
    if (res.rows.length === 0) {
      reply.code(404);
      return { error: 'user not found' };
    }
    return res.rows[0];
  });

  app.patch('/me', { onRequest: [app.authenticate] }, async (req) => {
    const body = z
      .object({
        name: z.string().max(80).optional(),
        village: z.string().max(120).optional(),
        village_id: z.string().max(120).optional(),
        district: z.string().max(80).optional(),
        language: z.enum(['mr', 'en']).optional(),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
      })
      .parse(req.body);
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const [k, v] of Object.entries(body)) {
      if (v === undefined) continue;
      fields.push(`${k} = $${idx++}`);
      values.push(v);
    }
    if (fields.length === 0) return { ok: true };
    values.push(req.userId);
    await query(`UPDATE users SET ${fields.join(', ')} WHERE id=$${idx}`, values);
    return { ok: true };
  });
}
