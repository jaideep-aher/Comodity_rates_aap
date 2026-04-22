import type { LocalizedName } from '../types';

// Heat / cold / wind thresholds per crop family. Used by the advisor engine to
// flag per-crop risk on the weather card.
export type Sensitivity = {
  heatWarnC: number;        // temperature where the crop starts stressing
  heatDangerC: number;      // temperature where the crop actively suffers
  coldWarnC: number;        // low-temp warning
  // Wind speed (km/h) above which pesticide spraying is unsafe/wasted.
  spraySafeWindMaxKph: number;
  // Rain chance above which spraying is wasted.
  spraySafeRainMaxPct: number;
  note: LocalizedName;
};

const DEFAULT: Sensitivity = {
  heatWarnC: 36,
  heatDangerC: 40,
  coldWarnC: 10,
  spraySafeWindMaxKph: 15,
  spraySafeRainMaxPct: 40,
  note: {
    mr: 'सामान्य हवामान सल्ला.',
    en: 'General weather advisory.',
  },
};

const TABLE: Record<string, Sensitivity> = {
  tomato: {
    heatWarnC: 34, heatDangerC: 38, coldWarnC: 12,
    spraySafeWindMaxKph: 12, spraySafeRainMaxPct: 30,
    note: {
      mr: 'टोमॅटो ३८°C पेक्षा जास्त उष्णतेत फुलगळ होऊ शकते.',
      en: 'Tomato flower drop above 38°C is common.',
    },
  },
  onion: {
    heatWarnC: 38, heatDangerC: 42, coldWarnC: 8,
    spraySafeWindMaxKph: 15, spraySafeRainMaxPct: 40,
    note: {
      mr: 'कांद्याला पाणी जास्त झाल्यास कंद कुजतो.',
      en: 'Onion bulbs rot with over-watering.',
    },
  },
  potato: {
    heatWarnC: 30, heatDangerC: 34, coldWarnC: 5,
    spraySafeWindMaxKph: 15, spraySafeRainMaxPct: 40,
    note: {
      mr: 'बटाटा ३०°C पेक्षा जास्त उष्णता सहन करत नाही.',
      en: 'Potato suffers tuber set above 30°C.',
    },
  },
  chili: {
    heatWarnC: 38, heatDangerC: 42, coldWarnC: 12,
    spraySafeWindMaxKph: 12, spraySafeRainMaxPct: 30,
    note: {
      mr: 'मिरचीला उष्णतेत फुलगळ होऊ शकते. ठिबक चालू ठेवा.',
      en: 'Chili flower drop in heat — keep drip running.',
    },
  },
  wheat: {
    heatWarnC: 32, heatDangerC: 36, coldWarnC: 4,
    spraySafeWindMaxKph: 18, spraySafeRainMaxPct: 40,
    note: {
      mr: 'गहू ३६°C पेक्षा जास्त उष्णतेत दाणे कमी भरतात.',
      en: 'Wheat grain fill hurts above 36°C.',
    },
  },
  rice: {
    heatWarnC: 36, heatDangerC: 40, coldWarnC: 15,
    spraySafeWindMaxKph: 18, spraySafeRainMaxPct: 50,
    note: {
      mr: 'भाताला लोंबी येण्याच्या वेळी उष्णता धोकादायक.',
      en: 'Heat at panicle initiation hits rice yield.',
    },
  },
  mango: {
    heatWarnC: 40, heatDangerC: 44, coldWarnC: 8,
    spraySafeWindMaxKph: 15, spraySafeRainMaxPct: 40,
    note: {
      mr: 'अवकाळी पावसाने आंब्याचा मोहोर गळतो.',
      en: 'Unseasonal rain causes mango flower drop.',
    },
  },
  grape: {
    heatWarnC: 36, heatDangerC: 40, coldWarnC: 5,
    spraySafeWindMaxKph: 12, spraySafeRainMaxPct: 25,
    note: {
      mr: 'द्राक्षावर आर्द्रतेत डावणी रोग वाढतो.',
      en: 'Humid spells trigger downy mildew on grape.',
    },
  },
};

export function sensitivityFor(iconKey: string): Sensitivity {
  return TABLE[iconKey] ?? DEFAULT;
}
