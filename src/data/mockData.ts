import type {
  Commodity,
  CommodityDetail,
  CommodityWithPrice,
  PriceSnapshot,
} from '../types';
import { COMMODITIES, TODAY_RAW } from './commodities';

export const TODAY_ISO = '2026-04-22';

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function addDays(iso: string, delta: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

function hashSlug(slug: string): number {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function generateHistory(c: Commodity, days: number): PriceSnapshot[] {
  const todayVals = TODAY_RAW[c.id];
  const rng = mulberry32(hashSlug(c.slug));
  const out: PriceSnapshot[] = [];

  const hasPrice = todayVals.avg > 0 || todayVals.min > 0;
  let avg = hasPrice ? todayVals.avg || (todayVals.min + todayVals.max) / 2 : 0;
  let min = todayVals.min;
  let max = todayVals.max;
  let arrival = todayVals.arrival;

  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(TODAY_ISO, -i);
    if (i === 0) {
      out.push({
        date,
        arrival: todayVals.arrival,
        min: todayVals.min,
        max: todayVals.max,
        avg: todayVals.avg || Math.round((todayVals.min + todayVals.max) / 2),
      });
      continue;
    }
    const walk = (rng() - 0.5) * 0.08;
    const arrivalWalk = (rng() - 0.5) * 0.3;
    if (hasPrice) {
      avg = Math.max(100, avg * (1 + walk));
      const band = (max - min) || avg * 0.15;
      min = Math.max(50, avg - band / 2);
      max = avg + band / 2;
    }
    arrival = Math.max(0, Math.round(arrival * (1 + arrivalWalk)));

    out.push({
      date,
      arrival,
      min: Math.round(min),
      max: Math.round(max),
      avg: Math.round(avg),
    });
  }
  return out;
}

const HISTORY_CACHE: Record<number, PriceSnapshot[]> = {};
function getHistory(c: Commodity): PriceSnapshot[] {
  if (!HISTORY_CACHE[c.id]) {
    HISTORY_CACHE[c.id] = generateHistory(c, 30);
  }
  return HISTORY_CACHE[c.id];
}

export function buildTodayList(): CommodityWithPrice[] {
  return COMMODITIES.map((c) => {
    const hist = getHistory(c);
    const today = hist[hist.length - 1];
    const yesterday = hist[hist.length - 2];
    const deltaPct =
      yesterday && yesterday.avg > 0 && today.avg > 0
        ? ((today.avg - yesterday.avg) / yesterday.avg) * 100
        : 0;
    const spark = hist.slice(-7).map((h) => h.avg);
    return {
      ...c,
      today,
      yesterday,
      deltaPct,
      spark,
    };
  });
}

export function buildDetail(slug: string): CommodityDetail | null {
  const c = COMMODITIES.find((x) => x.slug === slug);
  if (!c) return null;
  const hist = getHistory(c);
  const today = hist[hist.length - 1];
  const yesterday = hist[hist.length - 2];
  const deltaPct =
    yesterday && yesterday.avg > 0 && today.avg > 0
      ? ((today.avg - yesterday.avg) / yesterday.avg) * 100
      : 0;
  const spark = hist.slice(-7).map((h) => h.avg);
  return {
    ...c,
    today,
    yesterday,
    deltaPct,
    spark,
    history30d: hist,
  };
}

export { COMMODITIES };
