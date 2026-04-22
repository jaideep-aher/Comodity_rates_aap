import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../db.js';
import { trackEvent } from '../observability/analytics.js';

const CreateListing = z.object({
  commodityId: z.number().int().positive(),
  quantityQtl: z.number().positive(),
  qualityGrade: z.enum(['premium', 'standard', 'value']).default('standard'),
  askPrice: z.number().int().positive(),
  isNegotiable: z.boolean().default(true),
  village: z.string().min(1).max(120),
  taluka: z.string().max(120).optional(),
  district: z.string().max(120).optional(),
  state: z.string().max(80).default('Maharashtra'),
  readyFrom: z.string().optional(),
  readyUntil: z.string().optional(),
  notes: z.string().max(1000).optional(),
  photos: z.array(z.string().url()).max(6).default([]),
});

const UpdateListing = z.object({
  askPrice: z.number().int().positive().optional(),
  isNegotiable: z.boolean().optional(),
  notes: z.string().max(1000).optional(),
  photos: z.array(z.string().url()).max(6).optional(),
  status: z.enum(['open', 'reserved', 'sold', 'expired', 'hidden']).optional(),
});

type ListingRow = {
  id: string;
  commodity_id: number;
  commodity_slug: string;
  commodity_name_mr: string;
  commodity_name_en: string;
  icon_key: string;
  quantity_qtl: string;
  quality_grade: string;
  ask_price: number;
  is_negotiable: boolean;
  village: string;
  taluka: string | null;
  district: string | null;
  state: string;
  ready_from: string;
  ready_until: string | null;
  notes: string | null;
  photos: string[];
  status: string;
  view_count: number;
  seller_user_id: string;
  seller_name: string | null;
  seller_phone: string;
  created_at: string;
};

const SELECT_LISTING = `
  SELECT l.id, l.commodity_id, c.slug AS commodity_slug,
         c.name_mr AS commodity_name_mr, c.name_en AS commodity_name_en, c.icon_key,
         l.quantity_qtl, l.quality_grade, l.ask_price, l.is_negotiable,
         l.village, l.taluka, l.district, l.state,
         l.ready_from::text AS ready_from, l.ready_until::text AS ready_until,
         l.notes, l.photos, l.status, l.view_count,
         l.seller_user_id, u.name AS seller_name, u.phone AS seller_phone,
         l.created_at
  FROM listings l
  JOIN commodities c ON c.id = l.commodity_id
  JOIN users u ON u.id = l.seller_user_id
`;

function serialize(r: ListingRow) {
  return {
    id: r.id,
    commodity: {
      id: r.commodity_id,
      slug: r.commodity_slug,
      name: { mr: r.commodity_name_mr, en: r.commodity_name_en },
      iconKey: r.icon_key,
    },
    quantityQtl: Number(r.quantity_qtl),
    qualityGrade: r.quality_grade,
    askPrice: r.ask_price,
    isNegotiable: r.is_negotiable,
    location: {
      village: r.village,
      taluka: r.taluka,
      district: r.district,
      state: r.state,
    },
    readyFrom: r.ready_from,
    readyUntil: r.ready_until,
    notes: r.notes,
    photos: r.photos ?? [],
    status: r.status,
    viewCount: r.view_count,
    seller: {
      id: r.seller_user_id,
      name: r.seller_name,
      phone: r.seller_phone,
    },
    createdAt: r.created_at,
  };
}

export async function listingRoutes(app: FastifyInstance) {
  // Public: browse open listings.
  app.get('/listings', async (req) => {
    const schema = z.object({
      commodityId: z.coerce.number().int().optional(),
      category: z.enum(['veg', 'fruit', 'grain', 'turbhe']).optional(),
      district: z.string().optional(),
      maxPrice: z.coerce.number().int().optional(),
      limit: z.coerce.number().int().min(1).max(100).default(40),
    });
    const q = schema.parse(req.query);
    const parts: string[] = [`l.status = 'open'`];
    const params: any[] = [];
    if (q.commodityId) { params.push(q.commodityId); parts.push(`l.commodity_id = $${params.length}`); }
    if (q.category) { params.push(q.category); parts.push(`c.category = $${params.length}`); }
    if (q.district) { params.push(q.district); parts.push(`l.district = $${params.length}`); }
    if (q.maxPrice) { params.push(q.maxPrice); parts.push(`l.ask_price <= $${params.length}`); }
    params.push(q.limit);
    const sql = `${SELECT_LISTING} WHERE ${parts.join(' AND ')} ORDER BY l.created_at DESC LIMIT $${params.length}`;
    const res = await query<ListingRow>(sql, params);
    return res.rows.map(serialize);
  });

  app.get('/listings/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const res = await query<ListingRow>(`${SELECT_LISTING} WHERE l.id = $1`, [id]);
    if (res.rows.length === 0) {
      reply.code(404);
      return { error: 'listing not found' };
    }
    await query(`UPDATE listings SET view_count = view_count + 1 WHERE id=$1`, [id]);
    return serialize(res.rows[0]);
  });

  // Authenticated: CRUD my listings.
  app.get('/me/listings', { onRequest: [app.authenticate] }, async (req) => {
    const res = await query<ListingRow>(
      `${SELECT_LISTING} WHERE l.seller_user_id = $1 ORDER BY l.created_at DESC`,
      [req.userId!],
    );
    return res.rows.map(serialize);
  });

  app.post('/me/listings', { onRequest: [app.authenticate] }, async (req, reply) => {
    const body = CreateListing.parse(req.body);
    const res = await query<{ id: string }>(
      `INSERT INTO listings (
         seller_user_id, commodity_id, quantity_qtl, quality_grade, ask_price, is_negotiable,
         village, taluka, district, state, ready_from, ready_until, notes, photos
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,COALESCE($11::date, CURRENT_DATE),$12,$13,$14)
       RETURNING id`,
      [
        req.userId,
        body.commodityId,
        body.quantityQtl,
        body.qualityGrade,
        body.askPrice,
        body.isNegotiable,
        body.village,
        body.taluka ?? null,
        body.district ?? null,
        body.state,
        body.readyFrom ?? null,
        body.readyUntil ?? null,
        body.notes ?? null,
        body.photos,
      ],
    );
    const id = res.rows[0].id;
    trackEvent(req.userId, 'listing_created', { commodityId: body.commodityId, askPrice: body.askPrice });
    reply.code(201);
    return { id };
  });

  app.patch('/me/listings/:id', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = UpdateListing.parse(req.body);
    const fields: string[] = [];
    const params: any[] = [];
    const mapping: Record<string, string> = {
      askPrice: 'ask_price',
      isNegotiable: 'is_negotiable',
      notes: 'notes',
      photos: 'photos',
      status: 'status',
    };
    for (const [k, v] of Object.entries(body)) {
      if (v === undefined) continue;
      const col = mapping[k];
      if (!col) continue;
      params.push(v);
      fields.push(`${col} = $${params.length}`);
    }
    if (fields.length === 0) return { ok: true };
    fields.push(`updated_at = NOW()`);
    params.push(req.userId, id);
    const r = await query(
      `UPDATE listings SET ${fields.join(', ')}
       WHERE seller_user_id = $${params.length - 1} AND id = $${params.length}`,
      params,
    );
    if (r.rowCount === 0) {
      reply.code(404);
      return { error: 'listing not found' };
    }
    return { ok: true };
  });

  app.delete('/me/listings/:id', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const r = await query('DELETE FROM listings WHERE id=$1 AND seller_user_id=$2', [
      id,
      req.userId!,
    ]);
    if (r.rowCount === 0) {
      reply.code(404);
      return { error: 'listing not found' };
    }
    return { ok: true };
  });

  // Inquiries.
  app.post('/listings/:id/inquiries', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = z
      .object({
        message: z.string().min(1).max(2000),
        offerPrice: z.number().int().positive().optional(),
      })
      .parse(req.body);
    const listing = await query('SELECT 1 FROM listings WHERE id=$1 AND status=$2', [id, 'open']);
    if (listing.rows.length === 0) {
      reply.code(404);
      return { error: 'listing not found or closed' };
    }
    const res = await query<{ id: string }>(
      `INSERT INTO inquiries (listing_id, buyer_user_id, message, offer_price)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [id, req.userId, body.message, body.offerPrice ?? null],
    );
    trackEvent(req.userId, 'listing_inquiry_sent', { listingId: id });
    reply.code(201);
    return { id: res.rows[0].id };
  });

  app.get('/me/inquiries/sent', { onRequest: [app.authenticate] }, async (req) => {
    const res = await query(
      `SELECT i.id, i.listing_id, i.message, i.offer_price, i.status,
              i.created_at, l.ask_price, c.name_mr, c.name_en, c.slug AS commodity_slug
       FROM inquiries i
       JOIN listings l ON l.id = i.listing_id
       JOIN commodities c ON c.id = l.commodity_id
       WHERE i.buyer_user_id = $1
       ORDER BY i.created_at DESC`,
      [req.userId!],
    );
    return res.rows;
  });

  app.get('/me/inquiries/received', { onRequest: [app.authenticate] }, async (req) => {
    const res = await query(
      `SELECT i.id, i.listing_id, i.buyer_user_id, i.message, i.offer_price, i.status,
              i.created_at, u.name AS buyer_name, u.phone AS buyer_phone,
              c.name_mr, c.name_en
       FROM inquiries i
       JOIN listings l ON l.id = i.listing_id
       JOIN commodities c ON c.id = l.commodity_id
       JOIN users u ON u.id = i.buyer_user_id
       WHERE l.seller_user_id = $1
       ORDER BY i.created_at DESC`,
      [req.userId!],
    );
    return res.rows;
  });
}
