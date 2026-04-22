import cron from 'node-cron';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { query } from '../db.js';
import { sendPush } from './sender.js';
import { cached } from '../cache.js';

// Morning advisory cron (06:00 IST by default).
// For every user with at least one watchlisted crop and a known location,
// fetch a weather forecast (cached per 2-decimal lat/lng cell so nearby
// villages share a single upstream call) and emit a short actionable push.

let started = false;

export function startAdvisoryCron() {
  if (!config.advisoryEnabled) {
    logger.info('advisory cron disabled');
    return;
  }
  if (started) return;
  started = true;
  logger.info({ cron: config.advisoryCron, tz: config.digestTimezone }, 'starting advisory cron');
  cron.schedule(
    config.advisoryCron,
    async () => {
      try {
        const n = await runAdvisories();
        logger.info({ delivered: n }, 'advisory run complete');
      } catch (err) {
        logger.error({ err }, 'advisory run failed');
      }
    },
    { timezone: config.digestTimezone },
  );
}

type Forecast = {
  date: string;
  kind: 'sunny' | 'cloudy' | 'partly' | 'rain' | 'storm' | 'hot';
  tempMaxC: number;
  tempMinC: number;
  rainChance: number;
  windKph: number;
};

export async function runAdvisories(): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);

  // Pull users who have a watchlist and a location.
  const users = await query<{
    id: string;
    name: string | null;
    language: 'mr' | 'en';
    latitude: number | null;
    longitude: number | null;
    crops: string | null;
  }>(
    `SELECT u.id, u.name, u.language, u.latitude, u.longitude,
            STRING_AGG(c.name_mr || '|' || c.name_en || '|' || c.icon_key, ',' ORDER BY w.commodity_id) AS crops
     FROM users u
     JOIN watchlist w ON w.user_id = u.id
     JOIN commodities c ON c.id = w.commodity_id
     WHERE u.latitude IS NOT NULL AND u.longitude IS NOT NULL
     GROUP BY u.id`,
  );

  let delivered = 0;
  for (const u of users.rows) {
    if (u.latitude == null || u.longitude == null) continue;
    try {
      const forecast = await getForecastForCell(u.latitude, u.longitude);
      if (!forecast) continue;
      const primaryCrop = (u.crops ?? '').split(',')[0]?.split('|') ?? [];
      const cropName = u.language === 'mr' ? primaryCrop[0] : primaryCrop[1];
      const iconKey = primaryCrop[2] ?? '';
      const text = buildAdvisory(forecast[0], u.language, cropName, iconKey);
      if (!text) continue;
      const { title, body } = text;
      const res = await sendPush({
        userId: u.id,
        title,
        body,
        kind: 'advisory',
        dedupKey: `advisory:${today}`,
        data: { route: 'home' },
      });
      delivered += res.delivered;
    } catch (err) {
      logger.warn({ err, userId: u.id }, 'advisory send failed');
    }
  }
  return delivered;
}

async function getForecastForCell(lat: number, lng: number): Promise<Forecast[] | null> {
  const key = `weather:${lat.toFixed(2)}:${lng.toFixed(2)}`;
  try {
    return await cached(key, 60 * 30, () => fetchUpstream(lat, lng));
  } catch (err) {
    logger.warn({ err, lat, lng }, 'forecast fetch failed');
    return null;
  }
}

async function fetchUpstream(lat: number, lng: number): Promise<Forecast[]> {
  const url = new URL(config.openMeteoBase);
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lng));
  url.searchParams.set(
    'daily',
    'weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max',
  );
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', '2');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  const res = await fetch(url.toString(), { signal: controller.signal });
  clearTimeout(timer);
  if (!res.ok) throw new Error(`open-meteo ${res.status}`);
  const body = (await res.json()) as {
    daily?: {
      time: string[];
      weathercode: number[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      precipitation_probability_max: number[];
      wind_speed_10m_max: number[];
    };
  };
  const daily = body.daily;
  if (!daily) return [];
  const out: Forecast[] = [];
  for (let i = 0; i < daily.time.length; i += 1) {
    const code = daily.weathercode[i] ?? 0;
    const rain = Math.round(daily.precipitation_probability_max[i] ?? 0);
    const tempMaxC = Math.round(daily.temperature_2m_max[i] ?? 0);
    let kind: Forecast['kind'] = 'partly';
    if ([95, 96, 99].includes(code)) kind = 'storm';
    else if ([51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) kind = 'rain';
    else if (code === 0 && rain < 5) kind = 'sunny';
    else if (code === 1 || code === 2) kind = 'partly';
    else if (code === 3 || code === 45 || code === 48) kind = 'cloudy';
    if (kind === 'sunny' && tempMaxC >= 38) kind = 'hot';
    out.push({
      date: daily.time[i],
      kind,
      tempMaxC,
      tempMinC: Math.round(daily.temperature_2m_min[i] ?? 0),
      rainChance: rain,
      windKph: Math.round(daily.wind_speed_10m_max[i] ?? 0),
    });
  }
  return out;
}

function buildAdvisory(
  day: Forecast | undefined,
  lang: 'mr' | 'en',
  crop: string | undefined,
  _iconKey: string,
): { title: string; body: string } | null {
  if (!day) return null;
  const cropLabel = crop ?? (lang === 'mr' ? 'पिकासाठी' : 'your crop');

  if (day.kind === 'storm') {
    return lang === 'mr'
      ? { title: `⚠️ आज वादळ`, body: `${cropLabel}: फवारणी/काढणी टाळा. माल झाकून ठेवा.` }
      : { title: `⚠️ Storm today`, body: `${cropLabel}: skip spraying & harvest. Cover stock.` };
  }
  if (day.kind === 'rain' || day.rainChance >= 60) {
    return lang === 'mr'
      ? {
          title: `🌧️ पाऊस शक्य (${day.rainChance}%)`,
          body: `${cropLabel}: आज फवारणी टाळा. पाणी थांबवा.`,
        }
      : {
          title: `🌧️ Rain likely (${day.rainChance}%)`,
          body: `${cropLabel}: skip spraying and irrigation today.`,
        };
  }
  if (day.kind === 'hot' || day.tempMaxC >= 38) {
    return lang === 'mr'
      ? {
          title: `🔥 कडक ऊन ${day.tempMaxC}°`,
          body: `${cropLabel}: पहाटे / संध्याकाळी पाणी द्या.`,
        }
      : {
          title: `🔥 Heat ${day.tempMaxC}°`,
          body: `${cropLabel}: irrigate early morning or late evening.`,
        };
  }
  if (day.windKph >= 30) {
    return lang === 'mr'
      ? { title: `💨 जोराचा वारा`, body: `${cropLabel}: फवारणी पुढे ढकला.` }
      : { title: `💨 Windy day`, body: `${cropLabel}: postpone spraying.` };
  }
  return lang === 'mr'
    ? {
        title: `☀️ हवामान चांगले`,
        body: `${cropLabel}: नियमित काम सुरू ठेवा.`,
      }
    : {
        title: `☀️ Good weather`,
        body: `${cropLabel}: continue regular farm work.`,
      };
}
