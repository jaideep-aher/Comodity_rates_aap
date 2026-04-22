import type { Market, PremiumPlan, SubscriptionStatus } from '../types';
import { IS_REAL } from './config';
import { http } from './http';

export async function getMarkets(): Promise<Market[]> {
  if (!IS_REAL) {
    return [
      { slug: 'apmc_mumbai', name: { mr: 'मुंबई APMC', en: 'Mumbai APMC' }, state: 'Maharashtra', city: 'Mumbai', isPremium: false },
      { slug: 'apmc_pune',   name: { mr: 'पुणे APMC',   en: 'Pune APMC' },   state: 'Maharashtra', city: 'Pune',   isPremium: true  },
      { slug: 'apmc_nashik', name: { mr: 'नाशिक APMC', en: 'Nashik APMC' }, state: 'Maharashtra', city: 'Nashik', isPremium: true  },
      { slug: 'apmc_solapur',name: { mr: 'सोलापूर APMC',en: 'Solapur APMC' },state: 'Maharashtra', city: 'Solapur',isPremium: true  },
    ];
  }
  return http<Market[]>('/api/markets', { auth: false });
}

export type MultiMarketResponse = {
  slug: string;
  markets: {
    market: string;
    today: {
      date: string;
      min: number;
      max: number;
      avg: number;
      arrival: number;
    };
  }[];
  source: string;
};

export async function getMultiMarket(slug: string): Promise<MultiMarketResponse | null> {
  if (!IS_REAL) {
    return {
      slug,
      source: 'mock',
      markets: [
        { market: 'apmc_mumbai', today: { date: '2026-04-22', min: 1400, max: 2200, avg: 1800, arrival: 420 } },
        { market: 'apmc_pune',   today: { date: '2026-04-22', min: 1500, max: 2100, avg: 1780, arrival: 280 } },
        { market: 'apmc_nashik', today: { date: '2026-04-22', min: 1350, max: 2050, avg: 1720, arrival: 310 } },
      ],
    };
  }
  try {
    return await http(`/api/commodity/${slug}/markets`, { auth: false });
  } catch {
    return null;
  }
}

// ─── Subscriptions ──

export async function getPlans(): Promise<{
  plans: PremiumPlan[];
  features: string[];
  razorpayKeyId: string | null;
}> {
  if (!IS_REAL) {
    return {
      plans: [
        { id: 'monthly', amountPaise: 4900, interval: 'month', durationDays: 30 },
        { id: 'yearly', amountPaise: 49900, interval: 'year', durationDays: 365 },
      ],
      features: ['multi_market', 'history_1y', 'sms_fallback', 'data_export', 'priority_support'],
      razorpayKeyId: null,
    };
  }
  return http('/api/premium/plans', { auth: false });
}

export async function getMySubscription(): Promise<SubscriptionStatus> {
  if (!IS_REAL) return { active: false, plan: null, status: 'none', currentPeriodEnd: null };
  return http<SubscriptionStatus>('/api/me/subscription');
}

export async function startCheckout(plan: 'monthly' | 'yearly'): Promise<{
  orderId: string;
  amount: number;
  currency: string;
  razorpayKeyId: string | null;
  isMock: boolean;
}> {
  if (!IS_REAL) {
    return { orderId: 'mock-' + Date.now(), amount: plan === 'yearly' ? 49900 : 4900, currency: 'INR', razorpayKeyId: null, isMock: true };
  }
  return http('/api/me/subscription/checkout', { method: 'POST', body: { plan } });
}

export async function verifyCheckout(payload: {
  orderId: string;
  paymentId: string;
  signature: string;
}): Promise<{ ok: boolean; plan: 'monthly' | 'yearly'; currentPeriodEnd: string }> {
  if (!IS_REAL) {
    return {
      ok: true,
      plan: 'monthly',
      currentPeriodEnd: new Date(Date.now() + 30 * 86400_000).toISOString(),
    };
  }
  return http('/api/me/subscription/verify', { method: 'POST', body: payload });
}
