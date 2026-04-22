import type { Language } from '../types';

// Calendar by iconKey (family) rather than per-slug, since most families
// share sowing / harvest windows in Maharashtra. Months are 1-indexed
// (1 = January).
type Window = { months: number[]; tip: { mr: string; en: string } };

type Entry = {
  sowing: Window;
  harvest: Window;
  notes: { mr: string; en: string };
};

const CALENDAR: Record<string, Entry> = {
  tomato: {
    sowing: {
      months: [6, 7, 11, 12],
      tip: {
        mr: 'खरीप: जून-जुलै. रब्बी: नोव्हेंबर-डिसेंबर.',
        en: 'Kharif: Jun–Jul. Rabi: Nov–Dec.',
      },
    },
    harvest: {
      months: [9, 10, 2, 3],
      tip: {
        mr: 'पेरणीनंतर ७०-८० दिवसांत तोडणी सुरू.',
        en: 'Harvest begins 70–80 days after transplanting.',
      },
    },
    notes: {
      mr: 'पावसाळी टोमॅटोला फवारणीचे वेळापत्रक काटेकोर ठेवा.',
      en: 'Kharif crop needs a strict spray schedule for blight.',
    },
  },
  onion: {
    sowing: {
      months: [10, 11, 12],
      tip: { mr: 'रब्बी हंगाम — ऑक्टोबर ते डिसेंबर.', en: 'Rabi — Oct to Dec.' },
    },
    harvest: {
      months: [3, 4, 5],
      tip: { mr: 'मार्च ते मे मध्ये काढणी.', en: 'Harvest March to May.' },
    },
    notes: {
      mr: 'काढणीनंतर ७ दिवस सुकवून साठवण करा.',
      en: 'Cure for 7 days after harvest before storage.',
    },
  },
  potato: {
    sowing: {
      months: [10, 11],
      tip: { mr: 'ऑक्टोबर-नोव्हेंबरमध्ये लागवड.', en: 'Plant in Oct–Nov.' },
    },
    harvest: {
      months: [1, 2, 3],
      tip: { mr: 'जानेवारी-मार्च.', en: 'Jan to March.' },
    },
    notes: {
      mr: 'बियाणे प्रमाणित असावे — उत्पादन १५% वाढते.',
      en: 'Use certified seed — yield rises ~15%.',
    },
  },
  chili: {
    sowing: {
      months: [6, 7, 1, 2],
      tip: { mr: 'खरीप: जून. उन्हाळी: जानेवारी-फेब्रुवारी.', en: 'Kharif: Jun. Summer: Jan–Feb.' },
    },
    harvest: {
      months: [10, 11, 4, 5],
      tip: { mr: 'लागवडीनंतर १००-१२० दिवसांत.', en: '100–120 days after transplant.' },
    },
    notes: {
      mr: 'फुलोरा अवस्थेत पाणी आवश्यक.',
      en: 'Needs steady water at flowering.',
    },
  },
  wheat: {
    sowing: {
      months: [10, 11, 12],
      tip: { mr: 'रब्बी — ऑक्टोबर ते डिसेंबर.', en: 'Rabi — Oct to Dec.' },
    },
    harvest: {
      months: [3, 4],
      tip: { mr: 'मार्च-एप्रिल.', en: 'March–April.' },
    },
    notes: {
      mr: '२-३ वेळा पाण्याची गरज.',
      en: 'Needs 2–3 irrigations.',
    },
  },
  rice: {
    sowing: {
      months: [6, 7],
      tip: { mr: 'खरीप — पावसाळ्याच्या सुरुवातीला.', en: 'Kharif — early monsoon.' },
    },
    harvest: {
      months: [10, 11],
      tip: { mr: 'ऑक्टोबर-नोव्हेंबर.', en: 'Oct–Nov.' },
    },
    notes: {
      mr: 'पावसाळ्यानंतर पाण्याच्या उपलब्धतेनुसार वाण निवडा.',
      en: 'Pick variety based on post-monsoon water availability.',
    },
  },
  mango: {
    sowing: { months: [], tip: { mr: 'बहुवर्षीय झाड — लागवड जून-जुलै.', en: 'Perennial — plant Jun–Jul.' } },
    harvest: {
      months: [4, 5, 6],
      tip: { mr: 'एप्रिल-जून मध्ये तोडणी.', en: 'Harvest April–June.' },
    },
    notes: {
      mr: 'फळमाशीसाठी फेरोमोन सापळे वापरा.',
      en: 'Use pheromone traps against fruit flies.',
    },
  },
  default: {
    sowing: { months: [6, 7, 10, 11], tip: { mr: 'खरीप व रब्बी दोन्हीत लागवड शक्य.', en: 'Both kharif and rabi possible.' } },
    harvest: { months: [2, 3, 9, 10], tip: { mr: 'हंगामानुसार.', en: 'Depends on season.' } },
    notes: {
      mr: 'स्थानिक कृषी अधिकाऱ्यांचा सल्ला घ्या.',
      en: 'Consult your Krishi Sahayak for local specifics.',
    },
  },
};

const MONTH_MR = ['जाने', 'फेब्रु', 'मार्च', 'एप्रि', 'मे', 'जून', 'जुलै', 'ऑग', 'सप्टें', 'ऑक्टो', 'नोव्हें', 'डिसें'];
const MONTH_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function calendarFor(iconKey: string) {
  return CALENDAR[iconKey] ?? CALENDAR.default;
}

export function monthLabel(month: number, lang: Language): string {
  const m = ((month - 1) % 12 + 12) % 12;
  return lang === 'mr' ? MONTH_MR[m] : MONTH_EN[m];
}

export function monthsAsList(months: number[], lang: Language): string {
  if (months.length === 0) return lang === 'mr' ? 'वर्षभर' : 'Year-round';
  return months.map((m) => monthLabel(m, lang)).join(', ');
}
