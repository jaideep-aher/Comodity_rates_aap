import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WeatherKind } from '../components/illustrations/WeatherGlyph';
import type { WeatherDay } from '../data/weather';
import { getWeather as mockForecast } from '../data/weather';
import { API_URL, IS_REAL } from './config';

// Live weather service. Two paths:
//   1. Open-Meteo direct from the device (no API key, CORS-friendly). This
//      is the default — keeps the mobile app working even if our backend is
//      down.
//   2. Our backend `/api/weather/forecast` when IS_REAL is true — gives us a
//      central place to attach IMD Agromet overlays and caching later.
//
// Both paths are tried in order. If both fail we transparently fall back to
// the mock forecast so the UI never shows a blank weather card.

const CACHE_PREFIX = 'bajarbhav:weather:';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

type CachedEntry = { ts: number; days: WeatherDay[]; source: 'open-meteo' | 'backend' | 'mock' };

export type ForecastResult = {
  days: WeatherDay[];
  source: CachedEntry['source'];
  fetchedAt: number;
};

function cacheKey(lat: number, lng: number): string {
  return `${CACHE_PREFIX}${lat.toFixed(2)},${lng.toFixed(2)}`;
}

async function readCache(lat: number, lng: number): Promise<CachedEntry | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(lat, lng));
    if (!raw) return null;
    return JSON.parse(raw) as CachedEntry;
  } catch {
    return null;
  }
}

async function writeCache(lat: number, lng: number, entry: CachedEntry): Promise<void> {
  try {
    await AsyncStorage.setItem(cacheKey(lat, lng), JSON.stringify(entry));
  } catch {
    // storage full / unavailable — skip
  }
}

export async function getForecast(lat: number, lng: number): Promise<ForecastResult> {
  const cached = await readCache(lat, lng);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return { days: cached.days, source: cached.source, fetchedAt: cached.ts };
  }

  // 1. Try the backend proxy when running in real mode.
  if (IS_REAL) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(
        `${API_URL}/api/weather/forecast?lat=${lat}&lng=${lng}`,
        { signal: controller.signal },
      );
      clearTimeout(timer);
      if (res.ok) {
        const body = (await res.json()) as { days: WeatherDay[] };
        const entry: CachedEntry = { ts: Date.now(), days: body.days, source: 'backend' };
        await writeCache(lat, lng, entry);
        return { days: entry.days, source: entry.source, fetchedAt: entry.ts };
      }
    } catch {
      // fall through to Open-Meteo
    }
  }

  // 2. Direct Open-Meteo call (no key, free for non-commercial use).
  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lng));
    url.searchParams.set(
      'hourly',
      'precipitation_probability,relative_humidity_2m,wind_speed_10m,temperature_2m',
    );
    url.searchParams.set(
      'daily',
      'weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,relative_humidity_2m_mean',
    );
    url.searchParams.set('timezone', 'auto');
    url.searchParams.set('forecast_days', '7');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`open-meteo ${res.status}`);

    const json = await res.json();
    const days = parseOpenMeteo(json);
    const entry: CachedEntry = { ts: Date.now(), days, source: 'open-meteo' };
    await writeCache(lat, lng, entry);
    return { days: entry.days, source: entry.source, fetchedAt: entry.ts };
  } catch {
    // fall through to mock
  }

  // 3. Last resort: stale cache > mock.
  if (cached) {
    return { days: cached.days, source: cached.source, fetchedAt: cached.ts };
  }
  const fallback = mockForecast('2026-04-22');
  return { days: fallback, source: 'mock', fetchedAt: Date.now() };
}

// WMO weather code → our five-bucket glyph kind.
function kindForCode(code: number, rainProb: number): WeatherKind {
  if ([95, 96, 99].includes(code)) return 'storm';
  if ([51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'rain';
  if (code === 0) return rainProb < 5 ? 'sunny' : 'partly';
  if (code === 1 || code === 2) return 'partly';
  if (code === 3 || code === 45 || code === 48) return 'cloudy';
  return 'partly';
}

function adviceFor(kind: WeatherKind, tempMaxC: number): WeatherDay['advice'] {
  if (kind === 'storm') {
    return {
      mr: 'शेतातले काम टाळा. सुरक्षित ठिकाणी रहा.',
      en: 'Skip field work. Stay safe indoors.',
    };
  }
  if (kind === 'rain') {
    return {
      mr: 'फवारणी टाळा. काढणी केलेला माल झाकून ठेवा.',
      en: 'Skip spraying. Cover harvested stock.',
    };
  }
  if (kind === 'hot' || tempMaxC >= 38) {
    return {
      mr: 'पहाटे / संध्याकाळी पाणी द्या. दुपारी फवारणी टाळा.',
      en: 'Irrigate early or late. Avoid mid-day spraying.',
    };
  }
  if (kind === 'cloudy') {
    return {
      mr: 'ढगाळ दिवस. फवारणी करता येईल पण पावसावर लक्ष ठेवा.',
      en: 'Cloudy day. Spraying OK but watch the rain.',
    };
  }
  return {
    mr: 'चांगला दिवस. शेतकामासाठी योग्य.',
    en: 'Good day for field work.',
  };
}

function labelFor(kind: WeatherKind, tempMaxC: number): WeatherDay['label'] {
  if (kind === 'storm') return { mr: 'गडगडाटासह पाऊस', en: 'Thundershowers' };
  if (kind === 'rain') return { mr: 'पाऊस शक्य', en: 'Rain likely' };
  if (tempMaxC >= 38) return { mr: 'कडक ऊन', en: 'Hot & sunny' };
  if (kind === 'cloudy') return { mr: 'ढगाळ', en: 'Cloudy' };
  if (kind === 'partly') return { mr: 'अल्प ढग', en: 'Partly cloudy' };
  return { mr: 'स्वच्छ सूर्यप्रकाश', en: 'Clear sun' };
}

type OpenMeteoResponse = {
  daily?: {
    time: string[];
    weathercode: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    wind_speed_10m_max: number[];
    relative_humidity_2m_mean: number[];
  };
  hourly?: {
    time: string[];
    precipitation_probability: number[];
  };
};

function parseOpenMeteo(json: OpenMeteoResponse): WeatherDay[] {
  const daily = json.daily;
  const hourly = json.hourly;
  if (!daily) return [];

  const out: WeatherDay[] = [];
  const count = Math.min(7, daily.time.length);
  const nowMs = Date.now();

  for (let i = 0; i < count; i += 1) {
    const date = daily.time[i];
    const code = daily.weathercode[i] ?? 0;
    const rainChance = Math.round(daily.precipitation_probability_max[i] ?? 0);
    const tempMaxC = Math.round(daily.temperature_2m_max[i] ?? 0);
    const tempMinC = Math.round(daily.temperature_2m_min[i] ?? 0);
    const windKph = Math.round(daily.wind_speed_10m_max[i] ?? 0);
    const humidity = Math.round(daily.relative_humidity_2m_mean[i] ?? 0);

    let kind = kindForCode(code, rainChance);
    if (kind === 'sunny' && tempMaxC >= 38) kind = 'hot';

    let hourlyRainPct: number[] = [];
    if (i === 0 && hourly) {
      // Pull the 12 hours starting from "now".
      const startIdx = hourly.time.findIndex(
        (t) => new Date(t).getTime() >= nowMs - 30 * 60_000,
      );
      const base = startIdx === -1 ? 0 : startIdx;
      hourlyRainPct = hourly.precipitation_probability
        .slice(base, base + 12)
        .map((n) => Math.round(n ?? 0));
    }
    while (hourlyRainPct.length < 12) hourlyRainPct.push(rainChance);

    out.push({
      date,
      kind,
      tempMaxC,
      tempMinC,
      rainChance,
      windKph,
      humidity,
      hourlyRainPct,
      label: labelFor(kind, tempMaxC),
      advice: adviceFor(kind, tempMaxC),
    });
  }

  // Keep only 5 days (matches mock shape).
  return out.slice(0, 5);
}
