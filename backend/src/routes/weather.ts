import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { cached } from '../cache.js';
import { config } from '../config.js';
import { logger } from '../logger.js';

// Proxies Open-Meteo so we can:
//   1. Centralise caching (Redis) across all app users near the same village.
//   2. Attach IMD Agromet overlays later (next sprint).
//   3. Keep third-party API rate limits in a single process, not on devices.

type WeatherKind = 'sunny' | 'cloudy' | 'partly' | 'rain' | 'storm' | 'hot';

type WeatherDay = {
  date: string;
  kind: WeatherKind;
  tempMaxC: number;
  tempMinC: number;
  rainChance: number;
  windKph: number;
  humidity: number;
  hourlyRainPct: number[];
  label: { mr: string; en: string };
  advice: { mr: string; en: string };
};

export async function weatherRoutes(app: FastifyInstance) {
  app.get('/weather/forecast', async (req, reply) => {
    const schema = z.object({
      lat: z.coerce.number().min(-90).max(90),
      lng: z.coerce.number().min(-180).max(180),
    });
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'bad_params' });
    }
    const { lat, lng } = parsed.data;
    const key = `weather:${lat.toFixed(2)}:${lng.toFixed(2)}`;
    try {
      const days = await cached(key, 60 * 30, () => fetchOpenMeteo(lat, lng));
      return { days };
    } catch (err) {
      logger.warn({ err }, 'weather proxy fetch failed');
      return reply.code(502).send({ error: 'upstream_weather_failed' });
    }
  });
}

async function fetchOpenMeteo(lat: number, lng: number): Promise<WeatherDay[]> {
  const url = new URL(config.openMeteoBase);
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
  const timer = setTimeout(() => controller.abort(), 7000);
  const res = await fetch(url.toString(), { signal: controller.signal });
  clearTimeout(timer);
  if (!res.ok) throw new Error(`open-meteo ${res.status}`);
  const body = (await res.json()) as OpenMeteoResponse;
  return parseDays(body);
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

function kindFor(code: number, rain: number): WeatherKind {
  if ([95, 96, 99].includes(code)) return 'storm';
  if ([51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'rain';
  if (code === 0) return rain < 5 ? 'sunny' : 'partly';
  if (code === 1 || code === 2) return 'partly';
  if (code === 3 || code === 45 || code === 48) return 'cloudy';
  return 'partly';
}

function labelFor(kind: WeatherKind, tempMaxC: number): WeatherDay['label'] {
  if (kind === 'storm') return { mr: 'गडगडाटासह पाऊस', en: 'Thundershowers' };
  if (kind === 'rain') return { mr: 'पाऊस शक्य', en: 'Rain likely' };
  if (tempMaxC >= 38) return { mr: 'कडक ऊन', en: 'Hot & sunny' };
  if (kind === 'cloudy') return { mr: 'ढगाळ', en: 'Cloudy' };
  if (kind === 'partly') return { mr: 'अल्प ढग', en: 'Partly cloudy' };
  return { mr: 'स्वच्छ सूर्यप्रकाश', en: 'Clear sun' };
}

function adviceFor(kind: WeatherKind, tempMaxC: number): WeatherDay['advice'] {
  if (kind === 'storm') {
    return { mr: 'शेतातले काम टाळा.', en: 'Skip field work.' };
  }
  if (kind === 'rain') {
    return { mr: 'फवारणी टाळा. माल झाकून ठेवा.', en: 'Skip spraying. Cover stock.' };
  }
  if (kind === 'hot' || tempMaxC >= 38) {
    return {
      mr: 'पहाटे / संध्याकाळी पाणी द्या.',
      en: 'Irrigate early or late.',
    };
  }
  if (kind === 'cloudy') {
    return {
      mr: 'फवारणी करता येईल पण पावसावर लक्ष ठेवा.',
      en: 'Spraying OK but watch the rain.',
    };
  }
  return { mr: 'चांगला दिवस.', en: 'Good day.' };
}

function parseDays(body: OpenMeteoResponse): WeatherDay[] {
  const daily = body.daily;
  const hourly = body.hourly;
  if (!daily) return [];
  const out: WeatherDay[] = [];
  const now = Date.now();
  for (let i = 0; i < Math.min(5, daily.time.length); i += 1) {
    const code = daily.weathercode[i] ?? 0;
    const rain = Math.round(daily.precipitation_probability_max[i] ?? 0);
    const tempMaxC = Math.round(daily.temperature_2m_max[i] ?? 0);
    const tempMinC = Math.round(daily.temperature_2m_min[i] ?? 0);
    let kind = kindFor(code, rain);
    if (kind === 'sunny' && tempMaxC >= 38) kind = 'hot';
    let hourlyRainPct: number[] = [];
    if (i === 0 && hourly) {
      const startIdx = hourly.time.findIndex(
        (t) => new Date(t).getTime() >= now - 30 * 60_000,
      );
      const base = startIdx === -1 ? 0 : startIdx;
      hourlyRainPct = hourly.precipitation_probability
        .slice(base, base + 12)
        .map((n) => Math.round(n ?? 0));
    }
    while (hourlyRainPct.length < 12) hourlyRainPct.push(rain);
    out.push({
      date: daily.time[i],
      kind,
      tempMaxC,
      tempMinC,
      rainChance: rain,
      windKph: Math.round(daily.wind_speed_10m_max[i] ?? 0),
      humidity: Math.round(daily.relative_humidity_2m_mean[i] ?? 0),
      hourlyRainPct,
      label: labelFor(kind, tempMaxC),
      advice: adviceFor(kind, tempMaxC),
    });
  }
  return out;
}
