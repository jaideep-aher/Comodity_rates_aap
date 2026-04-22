import type { Language } from '../types';
import type { WeatherDay } from '../data/weather';
import { COMMODITIES } from '../data/commodities';
import { evaluateAllActions } from '../utils/advisor';
import { lifecycleFor, stageAt, daysToHarvest } from '../data/cropStages';
import { tasksForStage } from '../data/cropTasks';
import { sensitivityFor } from '../data/cropSensitivity';

// Rule-based Q&A "brain" that answers the farmer's common questions without
// needing an LLM. Matches on Marathi + English keyword hits and composes a
// natural-language reply. Falls back to a "try rephrasing" line when nothing
// matches — and the Ask screen can escalate to the backend LLM proxy at that
// point.

export type AdvisorContext = {
  lang: Language;
  today: WeatherDay | null;
  upcoming: WeatherDay[];
  watchedCommodityIds: number[];
  sowingByCommodityId: Record<number, { sowingDate: string | null; variety: string | null } | undefined>;
};

export type AdvisorAnswer = {
  title: string;
  body: string;
  emoji: string;
  // When the rule engine couldn't confidently answer, set needsEscalation.
  // The UI then offers an "Ask Kisan-AI" button if the LLM proxy is wired up.
  needsEscalation: boolean;
};

type Matcher = {
  id: string;
  keywords: { mr: RegExp; en: RegExp };
  answer: (q: string, ctx: AdvisorContext) => AdvisorAnswer | null;
};

// ---------- utilities ----------
function findCommodityMention(q: string): (typeof COMMODITIES)[number] | null {
  const lower = q.toLowerCase();
  for (const c of COMMODITIES) {
    if (lower.includes(c.name.en.toLowerCase()) || q.includes(c.name.mr)) {
      return c;
    }
  }
  return null;
}

// ---------- matchers ----------
const MATCHERS: Matcher[] = [
  {
    id: 'spray',
    keywords: {
      mr: /फवारणी|फवारण|स्प्रे/,
      en: /\bspray|spraying|pesticide\b/i,
    },
    answer: (_q, ctx) => {
      if (!ctx.today) return null;
      const actions = evaluateAllActions(ctx.today, ctx.upcoming, null);
      const spray = actions.find((a) => a.action === 'spray');
      if (!spray) return null;
      return {
        title: spray.title[ctx.lang],
        body: spray.reason[ctx.lang],
        emoji: spray.emoji,
        needsEscalation: false,
      };
    },
  },
  {
    id: 'irrigate',
    keywords: {
      mr: /पाणी|ओलित|सिंचन/,
      en: /\b(water|irrigate|irrigation)\b/i,
    },
    answer: (_q, ctx) => {
      if (!ctx.today) return null;
      const actions = evaluateAllActions(ctx.today, ctx.upcoming, null);
      const irrig = actions.find((a) => a.action === 'irrigate');
      if (!irrig) return null;
      return {
        title: irrig.title[ctx.lang],
        body: irrig.reason[ctx.lang],
        emoji: irrig.emoji,
        needsEscalation: false,
      };
    },
  },
  {
    id: 'harvest',
    keywords: {
      mr: /काढणी|कापणी|हार्वेस्ट/,
      en: /\b(harvest|pick|reap)\b/i,
    },
    answer: (q, ctx) => {
      const c = findCommodityMention(q);
      if (c) {
        const inst = ctx.sowingByCommodityId[c.id];
        if (inst?.sowingDate) {
          const days = Math.floor(
            (Date.now() - new Date(inst.sowingDate + 'T00:00:00').getTime()) / 86_400_000,
          );
          const remaining = daysToHarvest(c.iconKey, days, inst.variety);
          const stage = stageAt(c.iconKey, days, inst.variety);
          const msg =
            remaining === 0
              ? ctx.lang === 'mr'
                ? `${c.name.mr} काढणीस तयार आहे. पहाटे तोडणी करा, थंड जागी ठेवा.`
                : `${c.name.en} is ready to harvest. Pick early morning, store cool.`
              : ctx.lang === 'mr'
                ? `${c.name.mr}: सध्या ${stage.name.mr} टप्पा. काढणीस सुमारे ${remaining} दिवस बाकी.`
                : `${c.name.en}: currently in ${stage.name.en}. About ${remaining} days to harvest.`;
          return {
            title: ctx.lang === 'mr' ? 'काढणीची वेळ' : 'Harvest timing',
            body: msg,
            emoji: '🧺',
            needsEscalation: false,
          };
        }
      }
      if (!ctx.today) return null;
      const actions = evaluateAllActions(ctx.today, ctx.upcoming, null);
      const h = actions.find((a) => a.action === 'harvest');
      if (!h) return null;
      return {
        title: h.title[ctx.lang],
        body: h.reason[ctx.lang],
        emoji: h.emoji,
        needsEscalation: false,
      };
    },
  },
  {
    id: 'rain',
    keywords: {
      mr: /पाऊस|पाउस|वादळ/,
      en: /\b(rain|storm|shower|thunder)\b/i,
    },
    answer: (_q, ctx) => {
      if (!ctx.today) return null;
      const chance = ctx.today.rainChance;
      const upcomingRain = ctx.upcoming.find((d) => d.rainChance >= 60);
      let body =
        ctx.lang === 'mr'
          ? `आज पावसाची शक्यता ${chance}%. `
          : `Rain chance today ${chance}%. `;
      if (upcomingRain) {
        body +=
          ctx.lang === 'mr'
            ? `${upcomingRain.date} रोजी जोरदार पाऊस शक्य.`
            : `Heavy rain likely on ${upcomingRain.date}.`;
      } else {
        body +=
          ctx.lang === 'mr'
            ? 'पुढच्या ५ दिवसांत विशेष पाऊस नाही.'
            : 'No heavy rain in the next 5 days.';
      }
      return {
        title: ctx.lang === 'mr' ? 'पावसाचा अंदाज' : 'Rain forecast',
        body,
        emoji: '🌧️',
        needsEscalation: false,
      };
    },
  },
  {
    id: 'heat',
    keywords: {
      mr: /उष्णता|गर्मी|तापमान|ऊन/,
      en: /\b(heat|hot|temperature|sun)\b/i,
    },
    answer: (q, ctx) => {
      if (!ctx.today) return null;
      const c = findCommodityMention(q);
      const sens = c ? sensitivityFor(c.iconKey) : null;
      const t = ctx.today.tempMaxC;
      let body =
        ctx.lang === 'mr'
          ? `आज कमाल तापमान ${t}°C. `
          : `Today's peak is ${t}°C. `;
      if (sens && t >= sens.heatDangerC) {
        body +=
          ctx.lang === 'mr'
            ? 'पिकासाठी गंभीर उष्णता — सकाळी पाणी + शेडनेट वापरा.'
            : 'Heat risk — irrigate before 9 AM and use shade net.';
      } else if (sens && t >= sens.heatWarnC) {
        body +=
          ctx.lang === 'mr'
            ? 'पिकावर सौम्य ताण — दुपारची कामे टाळा.'
            : 'Mild stress — avoid mid-day field work.';
      } else {
        body +=
          ctx.lang === 'mr'
            ? 'पिकासाठी सुरक्षित.'
            : 'Safe for your crop.';
      }
      return {
        title: ctx.lang === 'mr' ? 'तापमान' : 'Temperature',
        body,
        emoji: '🌡️',
        needsEscalation: false,
      };
    },
  },
  {
    id: 'tasks',
    keywords: {
      mr: /काय करू|आज.*काम|कामे/,
      en: /\b(what.*do|today.*task|tasks)\b/i,
    },
    answer: (q, ctx) => {
      const c = findCommodityMention(q);
      if (!c) return null;
      const inst = ctx.sowingByCommodityId[c.id];
      if (!inst?.sowingDate) {
        return {
          title: ctx.lang === 'mr' ? 'पेरणी तारीख अपूर्ण' : 'Sowing date needed',
          body:
            ctx.lang === 'mr'
              ? `${c.name.mr} साठी पेरणी तारीख नोंदवा. मग टप्प्यानुसार कामे दाखवू.`
              : `Log a sowing date for ${c.name.en} and we'll list stage-specific tasks.`,
          emoji: '📅',
          needsEscalation: false,
        };
      }
      const days = Math.floor(
        (Date.now() - new Date(inst.sowingDate + 'T00:00:00').getTime()) / 86_400_000,
      );
      const stage = stageAt(c.iconKey, days, inst.variety);
      const tasks = tasksForStage(c.iconKey, stage.key);
      const list = tasks
        .slice(0, 3)
        .map((t) => `• ${t.title[ctx.lang]} — ${t.detail[ctx.lang]}`)
        .join('\n');
      return {
        title: `${c.name[ctx.lang]} — ${stage.name[ctx.lang]}`,
        body: list || (ctx.lang === 'mr' ? 'या टप्प्यात विशेष काम नाही.' : 'No specific tasks this stage.'),
        emoji: stage.emoji,
        needsEscalation: false,
      };
    },
  },
  {
    id: 'sowing-when',
    keywords: {
      mr: /केव्हा.*लाव|पेरणी.*कधी/,
      en: /\b(when.*sow|when.*plant|sowing.*time)\b/i,
    },
    answer: (q, ctx) => {
      const c = findCommodityMention(q);
      if (!c) return null;
      const lc = lifecycleFor(c.iconKey);
      return {
        title: ctx.lang === 'mr' ? 'पेरणी काळ' : 'Sowing window',
        body:
          ctx.lang === 'mr'
            ? `${c.name.mr}: सरासरी ${lc.totalDays} दिवसांचे पीक. खरीप → जून-जुलै, रब्बी → ऑक्टो-नोव्हें. आपली माती व पाणी पाहून निवडा.`
            : `${c.name.en}: ~${lc.totalDays}-day crop. Kharif window: Jun–Jul; Rabi window: Oct–Nov. Pick based on your soil & water.`,
        emoji: '🌱',
        needsEscalation: false,
      };
    },
  },
];

// ---------- public API ----------
export function askAdvisor(question: string, ctx: AdvisorContext): AdvisorAnswer {
  for (const m of MATCHERS) {
    const hit = m.keywords[ctx.lang].test(question);
    if (!hit) continue;
    const ans = m.answer(question, ctx);
    if (ans) return ans;
  }

  return {
    title: ctx.lang === 'mr' ? 'अधिक तपशील हवा' : 'Need a bit more',
    body:
      ctx.lang === 'mr'
        ? 'कृपया स्पष्ट लिहा — पीक, समस्या, व लक्षणे. किंवा Kisan-AI कडे पाठवा.'
        : 'Please share crop, problem, and symptoms — or ask Kisan-AI.',
    emoji: '🤔',
    needsEscalation: true,
  };
}

export const SUGGESTED_QUESTIONS: { mr: string; en: string }[] = [
  { mr: 'आज फवारणी करू का?', en: 'Should I spray today?' },
  { mr: 'पुढचे ५ दिवस पाऊस कधी?', en: 'When will it rain next?' },
  { mr: 'टोमॅटो साठी आज काय करू?', en: 'What should I do for tomato today?' },
  { mr: 'कांद्याची काढणी कधी?', en: 'When is onion harvest?' },
  { mr: 'गव्हासाठी पेरणी कधी?', en: 'When to sow wheat?' },
];
