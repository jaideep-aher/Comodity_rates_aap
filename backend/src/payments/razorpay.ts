import { createHmac, randomBytes } from 'node:crypto';
import { request } from 'undici';
import { config } from '../config.js';
import { logger } from '../logger.js';

export type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  provider: 'razorpay' | 'mock';
};

export async function createOrder(params: {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  const { amountPaise, receipt, notes } = params;

  if (!config.razorpayKeyId || !config.razorpayKeySecret) {
    logger.warn('Razorpay not configured — returning a mock order');
    return {
      id: 'order_mock_' + randomBytes(8).toString('hex'),
      amount: amountPaise,
      currency: 'INR',
      receipt,
      status: 'created',
      provider: 'mock',
    };
  }

  const auth = Buffer.from(`${config.razorpayKeyId}:${config.razorpayKeySecret}`).toString('base64');
  const res = await request('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes: notes ?? {},
    }),
  });
  if (res.statusCode >= 300) {
    const txt = await res.body.text();
    throw new Error(`Razorpay order failed: ${res.statusCode} ${txt}`);
  }
  const data = (await res.body.json()) as RazorpayOrder;
  return { ...data, provider: 'razorpay' };
}

export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  if (!config.razorpayKeySecret) {
    return params.signature === 'mock-signature';
  }
  const expected = createHmac('sha256', config.razorpayKeySecret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest('hex');
  return timingSafeCompare(expected, params.signature);
}

export function verifyWebhookSignature(payloadRaw: string, signature: string): boolean {
  if (!config.razorpayWebhookSecret) return false;
  const expected = createHmac('sha256', config.razorpayWebhookSecret)
    .update(payloadRaw)
    .digest('hex');
  return timingSafeCompare(expected, signature);
}

function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}
