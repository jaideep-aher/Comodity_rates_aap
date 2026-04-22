import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../db.js';
import { config } from '../config.js';
import { createOrder, verifyPaymentSignature, verifyWebhookSignature } from '../payments/razorpay.js';
import { trackEvent } from '../observability/analytics.js';

function daysFor(plan: 'monthly' | 'yearly'): number {
  return plan === 'yearly' ? 365 : 30;
}

function priceFor(plan: 'monthly' | 'yearly'): number {
  return plan === 'yearly' ? config.premiumYearlyPaise : config.premiumMonthlyPaise;
}

export async function isPremium(userId: string): Promise<boolean> {
  const res = await query(
    `SELECT 1 FROM subscriptions
     WHERE user_id=$1 AND status='active' AND current_period_end > NOW()
     LIMIT 1`,
    [userId],
  );
  return res.rows.length > 0;
}

export async function subscriptionRoutes(app: FastifyInstance) {
  app.get('/premium/plans', async () => {
    return {
      plans: [
        { id: 'monthly', amountPaise: config.premiumMonthlyPaise, interval: 'month', durationDays: 30 },
        { id: 'yearly', amountPaise: config.premiumYearlyPaise, interval: 'year', durationDays: 365 },
      ],
      features: [
        'multi_market',
        'history_1y',
        'sms_fallback',
        'data_export',
        'priority_support',
      ],
      razorpayKeyId: config.razorpayKeyId ?? null,
    };
  });

  app.get('/me/subscription', { onRequest: [app.authenticate] }, async (req) => {
    const res = await query<{
      id: string;
      plan: string;
      status: string;
      started_at: string | null;
      current_period_end: string | null;
    }>(
      `SELECT id, plan, status, started_at, current_period_end
       FROM subscriptions
       WHERE user_id=$1
       ORDER BY created_at DESC LIMIT 1`,
      [req.userId!],
    );
    const sub = res.rows[0];
    const active = !!sub && sub.status === 'active' && !!sub.current_period_end && new Date(sub.current_period_end) > new Date();
    return {
      active,
      plan: sub?.plan ?? null,
      status: sub?.status ?? 'none',
      currentPeriodEnd: sub?.current_period_end ?? null,
    };
  });

  app.post('/me/subscription/checkout', { onRequest: [app.authenticate] }, async (req, reply) => {
    const body = z.object({ plan: z.enum(['monthly', 'yearly']) }).parse(req.body);
    const amount = priceFor(body.plan);
    const receipt = `bb_${req.userId!.slice(0, 8)}_${Date.now()}`;
    const order = await createOrder({
      amountPaise: amount,
      receipt,
      notes: { userId: req.userId!, plan: body.plan },
    });
    await query(
      `INSERT INTO subscriptions (user_id, plan, status, razorpay_order_id, amount_inr_paise)
       VALUES ($1, $2, 'pending', $3, $4)`,
      [req.userId, body.plan, order.id, amount],
    );
    reply.code(201);
    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      razorpayKeyId: config.razorpayKeyId,
      isMock: order.provider === 'mock',
    };
  });

  app.post('/me/subscription/verify', { onRequest: [app.authenticate] }, async (req, reply) => {
    const body = z
      .object({
        orderId: z.string(),
        paymentId: z.string(),
        signature: z.string(),
      })
      .parse(req.body);

    const ok = verifyPaymentSignature({
      orderId: body.orderId,
      paymentId: body.paymentId,
      signature: body.signature,
    });
    if (!ok) {
      reply.code(400);
      return { error: 'invalid signature' };
    }

    const sub = await query<{ id: string; plan: 'monthly' | 'yearly' }>(
      `SELECT id, plan FROM subscriptions WHERE razorpay_order_id=$1 AND user_id=$2`,
      [body.orderId, req.userId!],
    );
    if (sub.rows.length === 0) {
      reply.code(404);
      return { error: 'subscription not found' };
    }

    const { id, plan } = sub.rows[0];
    const days = daysFor(plan);
    await query(
      `UPDATE subscriptions
       SET status='active',
           razorpay_payment_id=$1,
           started_at=NOW(),
           current_period_end=NOW() + INTERVAL '${days} days',
           updated_at=NOW()
       WHERE id=$2`,
      [body.paymentId, id],
    );
    trackEvent(req.userId, 'subscription_activated', { plan });
    return { ok: true, plan, currentPeriodEnd: new Date(Date.now() + days * 86400_000).toISOString() };
  });

  // Razorpay webhook (configure in dashboard → send to /api/webhooks/razorpay)
  app.post('/webhooks/razorpay', { config: { rawBody: true } as any }, async (req, reply) => {
    const signature = req.headers['x-razorpay-signature'] as string | undefined;
    const raw = (req as any).rawBody || JSON.stringify(req.body);
    if (!signature || !verifyWebhookSignature(raw, signature)) {
      reply.code(401);
      return { error: 'invalid signature' };
    }
    const evt = req.body as any;
    const eventType = evt?.event as string;
    const payment = evt?.payload?.payment?.entity;
    if (eventType === 'payment.captured' && payment?.order_id) {
      const sub = await query<{ id: string; user_id: string; plan: 'monthly' | 'yearly' }>(
        'SELECT id, user_id, plan FROM subscriptions WHERE razorpay_order_id=$1',
        [payment.order_id],
      );
      if (sub.rows[0]) {
        const { id, plan } = sub.rows[0];
        const days = daysFor(plan);
        await query(
          `UPDATE subscriptions SET status='active', razorpay_payment_id=$1,
                started_at=COALESCE(started_at, NOW()),
                current_period_end=COALESCE(current_period_end, NOW() + INTERVAL '${days} days'),
                updated_at=NOW()
           WHERE id=$2`,
          [payment.id, id],
        );
      }
    }
    return { ok: true };
  });
}
