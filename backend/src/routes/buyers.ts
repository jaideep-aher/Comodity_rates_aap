import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../db.js';

const UpsertBuyer = z.object({
  businessName: z.string().min(1).max(160),
  contactName: z.string().max(120).optional(),
  phone: z.string().min(6).max(20),
  whatsapp: z.string().max(20).optional(),
  email: z.string().email().max(160).optional(),
  gstin: z.string().max(20).optional(),
  city: z.string().min(1).max(120),
  state: z.string().max(80).default('Maharashtra'),
  buysCategories: z.array(z.enum(['veg', 'fruit', 'grain', 'turbhe'])).default([]),
  monthlyVolumeQtl: z.number().int().positive().optional(),
  aboutMr: z.string().max(1500).optional(),
  aboutEn: z.string().max(1500).optional(),
});

export async function buyerRoutes(app: FastifyInstance) {
  app.get('/buyers', async (req) => {
    const schema = z.object({
      city: z.string().optional(),
      category: z.enum(['veg', 'fruit', 'grain', 'turbhe']).optional(),
      verifiedOnly: z.coerce.boolean().default(false),
      limit: z.coerce.number().int().min(1).max(100).default(40),
    });
    const q = schema.parse(req.query);
    const parts: string[] = ['1=1'];
    const params: any[] = [];
    if (q.city) { params.push(q.city); parts.push(`city = $${params.length}`); }
    if (q.category) { params.push(q.category); parts.push(`$${params.length} = ANY(buys_categories)`); }
    if (q.verifiedOnly) parts.push(`is_verified = TRUE`);
    params.push(q.limit);
    const res = await query(
      `SELECT id, business_name, contact_name, phone, whatsapp, email, city, state,
              buys_categories, monthly_volume_qtl, is_verified, is_paid, about_mr, about_en
       FROM buyer_profiles
       WHERE ${parts.join(' AND ')}
       ORDER BY is_paid DESC, is_verified DESC, created_at DESC
       LIMIT $${params.length}`,
      params,
    );
    return res.rows;
  });

  app.get('/me/buyer-profile', { onRequest: [app.authenticate] }, async (req, reply) => {
    const res = await query(
      `SELECT id, business_name, contact_name, phone, whatsapp, email, gstin, city, state,
              buys_categories, monthly_volume_qtl, is_verified, is_paid, paid_until,
              about_mr, about_en
       FROM buyer_profiles
       WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [req.userId!],
    );
    if (res.rows.length === 0) {
      reply.code(404);
      return { error: 'no buyer profile' };
    }
    return res.rows[0];
  });

  app.put('/me/buyer-profile', { onRequest: [app.authenticate] }, async (req) => {
    const body = UpsertBuyer.parse(req.body);
    const existing = await query<{ id: string }>(
      'SELECT id FROM buyer_profiles WHERE user_id=$1',
      [req.userId!],
    );
    if (existing.rows.length > 0) {
      await query(
        `UPDATE buyer_profiles SET
           business_name=$1, contact_name=$2, phone=$3, whatsapp=$4, email=$5, gstin=$6,
           city=$7, state=$8, buys_categories=$9, monthly_volume_qtl=$10,
           about_mr=$11, about_en=$12, updated_at = NOW()
         WHERE id=$13`,
        [
          body.businessName, body.contactName ?? null, body.phone, body.whatsapp ?? null,
          body.email ?? null, body.gstin ?? null, body.city, body.state,
          body.buysCategories, body.monthlyVolumeQtl ?? null,
          body.aboutMr ?? null, body.aboutEn ?? null,
          existing.rows[0].id,
        ],
      );
      return { id: existing.rows[0].id, updated: true };
    }
    const res = await query<{ id: string }>(
      `INSERT INTO buyer_profiles
         (user_id, business_name, contact_name, phone, whatsapp, email, gstin, city, state,
          buys_categories, monthly_volume_qtl, about_mr, about_en)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING id`,
      [
        req.userId, body.businessName, body.contactName ?? null, body.phone,
        body.whatsapp ?? null, body.email ?? null, body.gstin ?? null,
        body.city, body.state, body.buysCategories,
        body.monthlyVolumeQtl ?? null, body.aboutMr ?? null, body.aboutEn ?? null,
      ],
    );
    await query(`UPDATE users SET role = 'buyer' WHERE id=$1`, [req.userId!]);
    return { id: res.rows[0].id, updated: false };
  });
}
