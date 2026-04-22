import type { WeatherKind } from '../components/illustrations/WeatherGlyph';
import type { Language } from '../types';

export type WeatherDay = {
  date: string;
  kind: WeatherKind;
  tempMaxC: number;
  tempMinC: number;
  rainChance: number;
  // Average wind speed in km/h. Used by the advisor to flag unsafe spraying days.
  windKph: number;
  // Humidity % — used later by the pest-risk rule set.
  humidity: number;
  // 12-hour probability strip. Each entry is a % (0-100). Index 0 = next hour.
  hourlyRainPct: number[];
  label: { mr: string; en: string };
  advice: { mr: string; en: string };
};

// Mock forecast for the week centred on TODAY_ISO. When the real backend
// wires up IMD / OpenWeatherMap, `src/api/weather.ts` will swap this.
const MOCK_FORECAST: WeatherDay[] = [
  {
    date: '2026-04-22',
    kind: 'hot',
    tempMaxC: 38,
    tempMinC: 24,
    rainChance: 5,
    windKph: 9,
    humidity: 48,
    hourlyRainPct: [0, 0, 0, 5, 5, 10, 10, 5, 5, 0, 0, 0],
    label: { mr: 'कडक ऊन', en: 'Hot & sunny' },
    advice: {
      mr: 'पहाटे / संध्याकाळी पाणी द्या. दुपारी २ ते ४ फवारणी टाळा.',
      en: 'Irrigate early or late. Skip spraying from 2 PM to 4 PM.',
    },
  },
  {
    date: '2026-04-23',
    kind: 'partly',
    tempMaxC: 36,
    tempMinC: 23,
    rainChance: 15,
    windKph: 12,
    humidity: 55,
    hourlyRainPct: [0, 0, 5, 10, 15, 20, 20, 15, 10, 5, 0, 0],
    label: { mr: 'अल्प ढग', en: 'Partly cloudy' },
    advice: {
      mr: 'चांगला दिवस. रब्बी पिकांची काढणी करा.',
      en: 'Great day. Wrap up rabi harvests.',
    },
  },
  {
    date: '2026-04-24',
    kind: 'sunny',
    tempMaxC: 37,
    tempMinC: 24,
    rainChance: 5,
    windKph: 8,
    humidity: 46,
    hourlyRainPct: [0, 0, 0, 0, 5, 5, 5, 5, 0, 0, 0, 0],
    label: { mr: 'स्वच्छ सूर्यप्रकाश', en: 'Clear sun' },
    advice: {
      mr: 'पालेभाजीचे फवारणीसाठी योग्य दिवस.',
      en: 'Good window for leafy-veg spraying.',
    },
  },
  {
    date: '2026-04-25',
    kind: 'cloudy',
    tempMaxC: 33,
    tempMinC: 24,
    rainChance: 45,
    windKph: 18,
    humidity: 72,
    hourlyRainPct: [10, 15, 25, 40, 55, 60, 55, 45, 30, 20, 10, 5],
    label: { mr: 'ढगाळ', en: 'Cloudy' },
    advice: {
      mr: 'किडनाशक फवारणी दुपारनंतर टाळा.',
      en: 'Avoid pesticide sprays after noon.',
    },
  },
  {
    date: '2026-04-26',
    kind: 'rain',
    tempMaxC: 30,
    tempMinC: 22,
    rainChance: 78,
    windKph: 22,
    humidity: 86,
    hourlyRainPct: [40, 60, 75, 80, 80, 70, 60, 55, 50, 45, 35, 25],
    label: { mr: 'पाऊस शक्य', en: 'Rain likely' },
    advice: {
      mr: 'वाहतूक विस्कळीत होऊ शकते. काढणी केलेला माल साठवून ठेवा.',
      en: 'Transport may be delayed. Store harvested stock safely.',
    },
  },
  {
    date: '2026-04-27',
    kind: 'storm',
    tempMaxC: 28,
    tempMinC: 21,
    rainChance: 88,
    windKph: 32,
    humidity: 90,
    hourlyRainPct: [50, 70, 85, 90, 90, 85, 75, 65, 55, 45, 35, 25],
    label: { mr: 'गडगडाटासह पाऊस', en: 'Thundershowers' },
    advice: {
      mr: 'शेतात काम टाळा. सुरक्षित ठिकाणी रहा.',
      en: 'Skip field work. Stay safe indoors.',
    },
  },
  {
    date: '2026-04-28',
    kind: 'partly',
    tempMaxC: 32,
    tempMinC: 22,
    rainChance: 25,
    windKph: 14,
    humidity: 68,
    hourlyRainPct: [10, 15, 20, 25, 25, 20, 15, 10, 10, 5, 5, 0],
    label: { mr: 'अल्प ढग', en: 'Partly cloudy' },
    advice: {
      mr: 'खरीप तयारीची चांगली वेळ.',
      en: 'Good window to start kharif prep.',
    },
  },
];

export function getWeather(forDate: string): WeatherDay[] {
  const idx = MOCK_FORECAST.findIndex((d) => d.date === forDate);
  const start = idx >= 0 ? idx : 0;
  return MOCK_FORECAST.slice(start, start + 5);
}

export function weatherLabel(day: WeatherDay, lang: Language): string {
  return day.label[lang];
}
