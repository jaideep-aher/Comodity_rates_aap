import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../db.js';

const UpsertOperator = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().min(6).max(20),
  whatsapp: z.string().max(20).optional(),
  baseCity: z.string().min(1).max(120),
  truckTypes: z.array(z.string()).max(12).default([]),
});

const CreateOffer = z.object({
  truckType: z.string().min(1).max(60),
  capacityQtl: z.number().int().positive(),
  fromCity: z.string().min(1).max(120),
  toCity: z.string().min(1).max(120),
  availableFrom: z.string(),
  availableUntil: z.string().optional(),
  priceQuote: z.number().int().positive().optional(),
  priceUnit: z.enum(['trip', 'per_qtl', 'per_km']).default('trip'),
  notes: z.string().max(500).optional(),
});

const CreateRequest = z.object({
  fromCity: z.string().min(1).max(120),
  toCity: z.string().min(1).max(120),
  commodityId: z.number().int().positive().optional(),
  quantityQtl: z.number().int().positive(),
  neededBy: z.string(),
  maxBudget: z.number().int().positive().optional(),
  notes: z.string().max(500).optional(),
});

export async function transportRoutes(app: FastifyInstance) {
  // ─── Operator profile ──
  app.get('/me/transport-profile', { onRequest: [app.authenticate] }, async (req, reply) => {
    const res = await query(
      `SELECT id, name, phone, whatsapp, base_city, truck_types, is_verified, rating_avg, ratings_count
       FROM transport_operators WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1`,
      [req.userId!],
    );
    if (res.rows.length === 0) {
      reply.code(404);
      return { error: 'no transport profile' };
    }
    return res.rows[0];
  });

  app.put('/me/transport-profile', { onRequest: [app.authenticate] }, async (req) => {
    const body = UpsertOperator.parse(req.body);
    const existing = await query<{ id: string }>(
      'SELECT id FROM transport_operators WHERE user_id=$1',
      [req.userId!],
    );
    if (existing.rows.length > 0) {
      await query(
        `UPDATE transport_operators
         SET name=$1, phone=$2, whatsapp=$3, base_city=$4, truck_types=$5
         WHERE id=$6`,
        [body.name, body.phone, body.whatsapp ?? null, body.baseCity, body.truckTypes, existing.rows[0].id],
      );
      return { id: existing.rows[0].id, updated: true };
    }
    const ins = await query<{ id: string }>(
      `INSERT INTO transport_operators (user_id, name, phone, whatsapp, base_city, truck_types)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [req.userId, body.name, body.phone, body.whatsapp ?? null, body.baseCity, body.truckTypes],
    );
    await query(`UPDATE users SET role = 'transport' WHERE id=$1`, [req.userId!]);
    return { id: ins.rows[0].id, updated: false };
  });

  // ─── Offers (truck availability from operators) ──
  app.get('/transport/offers', async (req) => {
    const schema = z.object({
      fromCity: z.string().optional(),
      toCity: z.string().optional(),
      limit: z.coerce.number().int().min(1).max(100).default(40),
    });
    const q = schema.parse(req.query);
    const parts: string[] = [`o.status = 'open'`];
    const params: any[] = [];
    if (q.fromCity) { params.push(q.fromCity); parts.push(`o.from_city ILIKE $${params.length}`); }
    if (q.toCity) { params.push(q.toCity); parts.push(`o.to_city ILIKE $${params.length}`); }
    params.push(q.limit);
    const res = await query(
      `SELECT o.id, o.truck_type, o.capacity_qtl, o.from_city, o.to_city,
              o.available_from::text AS available_from, o.available_until::text AS available_until,
              o.price_quote, o.price_unit, o.notes, o.created_at,
              op.name AS operator_name, op.phone AS operator_phone, op.whatsapp AS operator_whatsapp,
              op.is_verified, op.rating_avg, op.ratings_count
       FROM transport_offers o
       JOIN transport_operators op ON op.id = o.operator_id
       WHERE ${parts.join(' AND ')}
       ORDER BY op.is_verified DESC, o.created_at DESC
       LIMIT $${params.length}`,
      params,
    );
    return res.rows;
  });

  app.post('/me/transport-offers', { onRequest: [app.authenticate] }, async (req, reply) => {
    const body = CreateOffer.parse(req.body);
    const op = await query<{ id: string }>(
      'SELECT id FROM transport_operators WHERE user_id=$1',
      [req.userId!],
    );
    if (op.rows.length === 0) {
      reply.code(400);
      return { error: 'create transport profile first' };
    }
    const ins = await query<{ id: string }>(
      `INSERT INTO transport_offers
         (operator_id, truck_type, capacity_qtl, from_city, to_city,
          available_from, available_until, price_quote, price_unit, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [
        op.rows[0].id, body.truckType, body.capacityQtl, body.fromCity, body.toCity,
        body.availableFrom, body.availableUntil ?? null,
        body.priceQuote ?? null, body.priceUnit, body.notes ?? null,
      ],
    );
    reply.code(201);
    return { id: ins.rows[0].id };
  });

  // ─── Requests (farmers/buyers needing transport) ──
  app.get('/transport/requests', async (req) => {
    const schema = z.object({
      fromCity: z.string().optional(),
      toCity: z.string().optional(),
      limit: z.coerce.number().int().min(1).max(100).default(40),
    });
    const q = schema.parse(req.query);
    const parts: string[] = [`r.status = 'open'`];
    const params: any[] = [];
    if (q.fromCity) { params.push(q.fromCity); parts.push(`r.from_city ILIKE $${params.length}`); }
    if (q.toCity) { params.push(q.toCity); parts.push(`r.to_city ILIKE $${params.length}`); }
    params.push(q.limit);
    const res = await query(
      `SELECT r.id, r.from_city, r.to_city, r.commodity_id, r.quantity_qtl,
              r.needed_by::text AS needed_by, r.max_budget, r.notes, r.created_at,
              u.name AS requester_name, u.phone AS requester_phone
       FROM transport_requests r
       JOIN users u ON u.id = r.requester_user_id
       WHERE ${parts.join(' AND ')}
       ORDER BY r.created_at DESC
       LIMIT $${params.length}`,
      params,
    );
    return res.rows;
  });

  app.post('/me/transport-requests', { onRequest: [app.authenticate] }, async (req, reply) => {
    const body = CreateRequest.parse(req.body);
    const ins = await query<{ id: string }>(
      `INSERT INTO transport_requests
         (requester_user_id, from_city, to_city, commodity_id, quantity_qtl, needed_by, max_budget, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [
        req.userId, body.fromCity, body.toCity,
        body.commodityId ?? null, body.quantityQtl, body.neededBy,
        body.maxBudget ?? null, body.notes ?? null,
      ],
    );
    reply.code(201);
    return { id: ins.rows[0].id };
  });
}
