import type { WeatherDay } from '../data/weather';
import { sensitivityFor } from '../data/cropSensitivity';
import type { LocalizedName } from '../types';

export type ActionKey = 'spray' | 'irrigate' | 'harvest' | 'plough';
export type Verdict = 'ok' | 'warn' | 'avoid';

export type ActionVerdict = {
  action: ActionKey;
  verdict: Verdict;
  emoji: string;
  title: LocalizedName;
  reason: LocalizedName;
};

const ACTION_EMOJI: Record<ActionKey, string> = {
  spray: '🧪',
  irrigate: '💧',
  harvest: '🌾',
  plough: '🚜',
};

const ACTION_TITLE: Record<ActionKey, LocalizedName> = {
  spray: { mr: 'फवारणी', en: 'Spray' },
  irrigate: { mr: 'सिंचन', en: 'Irrigate' },
  harvest: { mr: 'कापणी', en: 'Harvest' },
  plough: { mr: 'नांगरणी', en: 'Plough' },
};

// Common reasons, kept short so they fit inside chips / bottom sheets.
const R = {
  sprayGoodMorning: { mr: 'वारा शांत · पाऊस नाही · सकाळी ६-९ उत्तम.', en: 'Calm wind · no rain · 6-9 AM window.' },
  sprayWindy: { mr: 'वारा जास्त — फवारणी वाहून जाईल.', en: 'Too windy — spray will drift.' },
  sprayRainRisk: { mr: 'पाऊस शक्य — फवारणी धुऊन जाईल.', en: 'Rain risk — spray will wash off.' },
  sprayMidday: { mr: 'दुपारी टाळा, पहाटे / संध्याकाळी करा.', en: 'Avoid midday; early or evening only.' },

  irrigateNeeded: { mr: '३ दिवस पाऊस नाही — पाणी आवश्यक.', en: '3 dry days — irrigation needed.' },
  irrigateSkipRain: { mr: 'उद्या पाऊस ८०%+ — आज पाणी नको.', en: 'Rain tomorrow 80%+ — skip today.' },
  irrigateMorning: { mr: 'पहाटे / संध्याकाळी द्या, दुपारी नको.', en: 'Water early or late, not midday.' },

  harvestGood: { mr: 'कोरडा दिवस — काढणीसाठी उत्तम.', en: 'Dry day — great for harvest.' },
  harvestRain: { mr: 'पाऊस येतोय — काढणी झाली असल्यास झाका.', en: 'Rain incoming — tarp harvested stock.' },
  harvestWind: { mr: 'वारा जास्त — सावधगिरीने काढा.', en: 'Windy — harvest carefully.' },

  ploughGood: { mr: 'जमिनीत ओलावा योग्य — नांगरणीसाठी चांगला.', en: 'Soil moisture right — good for ploughing.' },
  ploughWet: { mr: 'पाऊस आला आहे — जमीन वाळू द्या.', en: 'Rain fell — let soil dry first.' },
};

function evaluateSpray(today: WeatherDay, iconKey: string | null): { verdict: Verdict; reason: LocalizedName } {
  const sens = iconKey ? sensitivityFor(iconKey) : null;
  const windMax = sens?.spraySafeWindMaxKph ?? 15;
  const rainMax = sens?.spraySafeRainMaxPct ?? 40;

  if (today.windKph >= windMax + 8) return { verdict: 'avoid', reason: R.sprayWindy };
  if (today.rainChance >= rainMax + 20) return { verdict: 'avoid', reason: R.sprayRainRisk };
  if (today.windKph >= windMax) return { verdict: 'warn', reason: R.sprayWindy };
  if (today.rainChance >= rainMax) return { verdict: 'warn', reason: R.sprayRainRisk };
  if (today.tempMaxC >= (sens?.heatWarnC ?? 36)) return { verdict: 'warn', reason: R.sprayMidday };
  return { verdict: 'ok', reason: R.sprayGoodMorning };
}

function evaluateIrrigate(today: WeatherDay, upcoming: WeatherDay[]): { verdict: Verdict; reason: LocalizedName } {
  const tomorrow = upcoming[0];
  if (tomorrow && tomorrow.rainChance >= 80) {
    return { verdict: 'avoid', reason: R.irrigateSkipRain };
  }
  const next3DryDays = upcoming.slice(0, 3).every((d) => d.rainChance < 40);
  if (next3DryDays && today.tempMaxC >= 32) {
    return { verdict: 'ok', reason: R.irrigateNeeded };
  }
  return { verdict: 'warn', reason: R.irrigateMorning };
}

function evaluateHarvest(today: WeatherDay, upcoming: WeatherDay[]): { verdict: Verdict; reason: LocalizedName } {
  if (today.rainChance >= 60) return { verdict: 'avoid', reason: R.harvestRain };
  if (today.windKph >= 25) return { verdict: 'warn', reason: R.harvestWind };
  const rainNext2 = upcoming.slice(0, 2).some((d) => d.rainChance >= 70);
  if (rainNext2) return { verdict: 'warn', reason: R.harvestRain };
  return { verdict: 'ok', reason: R.harvestGood };
}

function evaluatePlough(today: WeatherDay, upcoming: WeatherDay[]): { verdict: Verdict; reason: LocalizedName } {
  const wasRecentRain = upcoming[0]?.rainChance ?? 0;
  if (today.rainChance >= 70 || wasRecentRain >= 80) {
    return { verdict: 'avoid', reason: R.ploughWet };
  }
  if (today.rainChance >= 40) return { verdict: 'warn', reason: R.ploughWet };
  return { verdict: 'ok', reason: R.ploughGood };
}

export function evaluateAllActions(today: WeatherDay, upcoming: WeatherDay[], iconKey: string | null = null): ActionVerdict[] {
  const s = evaluateSpray(today, iconKey);
  const i = evaluateIrrigate(today, upcoming);
  const h = evaluateHarvest(today, upcoming);
  const p = evaluatePlough(today, upcoming);
  return [
    { action: 'spray', emoji: ACTION_EMOJI.spray, title: ACTION_TITLE.spray, ...s },
    { action: 'irrigate', emoji: ACTION_EMOJI.irrigate, title: ACTION_TITLE.irrigate, ...i },
    { action: 'harvest', emoji: ACTION_EMOJI.harvest, title: ACTION_TITLE.harvest, ...h },
    { action: 'plough', emoji: ACTION_EMOJI.plough, title: ACTION_TITLE.plough, ...p },
  ];
}

export type HeatStress = 'none' | 'mild' | 'severe';

export type HeatStressResult = {
  level: HeatStress;
  emoji: string;
  label: LocalizedName;
  note: LocalizedName;
};

export function heatStressFor(iconKey: string, tempMaxC: number): HeatStressResult {
  const s = sensitivityFor(iconKey);
  if (tempMaxC >= s.heatDangerC) {
    return {
      level: 'severe',
      emoji: '🔴',
      label: { mr: 'उष्णतेचा तीव्र ताण', en: 'Severe heat stress' },
      note: s.note,
    };
  }
  if (tempMaxC >= s.heatWarnC) {
    return {
      level: 'mild',
      emoji: '🟡',
      label: { mr: 'उष्णतेचा ताण', en: 'Heat stress' },
      note: s.note,
    };
  }
  return {
    level: 'none',
    emoji: '🟢',
    label: { mr: 'सुरक्षित तापमान', en: 'Safe temperature' },
    note: { mr: 'पिकासाठी योग्य तापमान.', en: 'Comfortable for the crop.' },
  };
}

// Quick helper for pretty verdict colour mapping (used by the chip component).
export const VERDICT_COLOR: Record<Verdict, { fg: string; bg: string; badge: string }> = {
  ok: { fg: '#15803D', bg: '#DCFCE7', badge: '✅' },
  warn: { fg: '#B45309', bg: '#FEF3C7', badge: '⚠️' },
  avoid: { fg: '#B91C1C', bg: '#FEE2E2', badge: '❌' },
};
