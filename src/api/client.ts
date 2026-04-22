import type { Category, Commodity, CommodityDetail, CommodityWithPrice } from '../types';
import { buildDetail, buildTodayList, COMMODITIES, TODAY_ISO } from '../data/mockData';
import { IS_REAL } from './config';
import { http, HttpError } from './http';

const MOCK_DELAY_MS = 250;
const delay = <T>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));

export type TodayResponse = {
  date: string;
  stale: boolean;
  source?: string;
  items: CommodityWithPrice[];
};

// ─── Mock implementations ────────────────────────────────────────────────

const mockApi = {
  async getToday(params?: { category?: Category; ids?: number[]; market?: string }): Promise<TodayResponse> {
    const all = buildTodayList();
    let items = all;
    if (params?.category) items = items.filter((c) => c.category === params.category);
    if (params?.ids && params.ids.length > 0) {
      const set = new Set(params.ids);
      items = items.filter((c) => set.has(c.id));
    }
    return delay({ date: TODAY_ISO, stale: false, source: 'mock', items });
  },

  async getCommodities(category?: Category): Promise<Commodity[]> {
    const items = category ? COMMODITIES.filter((c) => c.category === category) : COMMODITIES;
    return delay(items);
  },

  async getCommodityDetail(
    slug: string,
    _params?: { market?: string; days?: number },
  ): Promise<CommodityDetail | null> {
    return delay(buildDetail(slug));
  },

  async getTopMovers(kind: 'gainers' | 'losers' | 'arrivals'): Promise<CommodityWithPrice[]> {
    const all = buildTodayList().filter((c) => c.today.avg > 0);
    const sorted = [...all].sort((a, b) => {
      if (kind === 'arrivals') return b.today.arrival - a.today.arrival;
      if (kind === 'gainers') return b.deltaPct - a.deltaPct;
      return a.deltaPct - b.deltaPct;
    });
    return delay(sorted.slice(0, 5));
  },
};

// ─── Real implementations ────────────────────────────────────────────────

const realApi = {
  async getToday(params?: { category?: Category; ids?: number[]; market?: string }): Promise<TodayResponse> {
    return http<TodayResponse>('/api/prices/today', {
      auth: false,
      query: {
        category: params?.category,
        market: params?.market,
        ids: params?.ids && params.ids.length > 0 ? params.ids.join(',') : undefined,
      },
    });
  },

  async getCommodities(category?: Category): Promise<Commodity[]> {
    return http<Commodity[]>('/api/commodities', {
      auth: false,
      query: { category },
    });
  },

  async getCommodityDetail(
    slug: string,
    params?: { market?: string; days?: number },
  ): Promise<CommodityDetail | null> {
    try {
      return await http<CommodityDetail>(`/api/commodity/${slug}`, {
        auth: false,
        query: { market: params?.market, days: params?.days },
      });
    } catch (err) {
      if (err instanceof HttpError && err.status === 404) return null;
      throw err;
    }
  },

  async getTopMovers(
    kind: 'gainers' | 'losers' | 'arrivals',
    market?: string,
  ): Promise<CommodityWithPrice[]> {
    const res = await http<TodayResponse>('/api/prices/top-movers', {
      auth: false,
      query: { kind, market },
    });
    return res.items.slice(0, 5);
  },
};

// ─── Dispatcher ──────────────────────────────────────────────────────────

const impl = IS_REAL ? realApi : mockApi;

export const getToday = impl.getToday;
export const getCommodities = impl.getCommodities;
export const getCommodityDetail = impl.getCommodityDetail;
export const getTopMovers = impl.getTopMovers;

// Real-mode-only: remote watchlist sync. Mock mode persists locally only.
export async function pushWatchlistBulk(commodityIds: number[]): Promise<void> {
  if (!IS_REAL) return;
  await http('/api/me/watchlist/bulk', {
    method: 'PUT',
    body: { commodityIds },
  });
}

export async function pushWatchlistItem(
  commodityId: number,
  alertMin: number | null = null,
  alertMax: number | null = null,
): Promise<void> {
  if (!IS_REAL) return;
  await http('/api/me/watchlist', {
    method: 'POST',
    body: { commodityId, alertMin, alertMax },
  });
}

export async function removeWatchlistItem(commodityId: number): Promise<void> {
  if (!IS_REAL) return;
  await http(`/api/me/watchlist/${commodityId}`, { method: 'DELETE' });
}

export async function registerDeviceToken(fcmToken: string): Promise<void> {
  if (!IS_REAL) return;
  await http('/api/me/device-token', {
    method: 'POST',
    body: { fcmToken, platform: 'android' },
  });
}

export type ProfilePatch = {
  name?: string;
  village?: string;
  village_id?: string;
  district?: string;
  language?: 'mr' | 'en';
  latitude?: number;
  longitude?: number;
};

export async function syncProfile(patch: ProfilePatch): Promise<void> {
  if (!IS_REAL) return;
  await http('/api/me', { method: 'PATCH', body: patch });
}
