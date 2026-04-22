import type { Language } from '../types';

export type VideoTip = {
  id: string;
  title: { mr: string; en: string };
  channel: string;
  durationMin: number;
  thumb: string;
  url: string;
  tag: 'sowing' | 'pest' | 'market' | 'govt' | 'organic';
};

// Deeplinks to public Marathi agri-advisory videos. No keys needed — they open
// in the YouTube app via Linking on tap. Thumbnails use a data-less placeholder
// that we style locally; real thumbnails can be wired up when the backend
// serves a curated list.
export const VIDEOS: VideoTip[] = [
  {
    id: 'v1',
    title: {
      mr: 'टोमॅटो पिकाच्या कीड नियंत्रण — सोप्या पद्धती',
      en: 'Tomato pest control — simple methods',
    },
    channel: 'Krishi Jagran',
    durationMin: 8,
    thumb: 'pest',
    url: 'https://www.youtube.com/results?search_query=tomato+pest+control+marathi',
    tag: 'pest',
  },
  {
    id: 'v2',
    title: {
      mr: 'कांदा साठवणूक — नुकसान कमी करण्याचे ५ नियम',
      en: 'Onion storage — 5 rules to minimise losses',
    },
    channel: 'AgroStar',
    durationMin: 6,
    thumb: 'store',
    url: 'https://www.youtube.com/results?search_query=onion+storage+marathi',
    tag: 'market',
  },
  {
    id: 'v3',
    title: {
      mr: 'पीएम-किसान eKYC — मोबाईलवर स्वतः करा',
      en: 'PM-Kisan eKYC — do it yourself on mobile',
    },
    channel: 'PIB India',
    durationMin: 5,
    thumb: 'govt',
    url: 'https://www.youtube.com/results?search_query=pm+kisan+ekyc+marathi',
    tag: 'govt',
  },
  {
    id: 'v4',
    title: {
      mr: 'उन्हाळ्यात भेंडीला पाणी किती द्यावे?',
      en: 'How much water does okra need in summer?',
    },
    channel: 'Krishi Samvad',
    durationMin: 7,
    thumb: 'water',
    url: 'https://www.youtube.com/results?search_query=bhendi+summer+marathi',
    tag: 'sowing',
  },
  {
    id: 'v5',
    title: {
      mr: 'सेंद्रिय खत घरच्या घरी बनवा',
      en: 'Make organic fertiliser at home',
    },
    channel: 'Maharashtra Krishi',
    durationMin: 10,
    thumb: 'organic',
    url: 'https://www.youtube.com/results?search_query=organic+fertilizer+marathi',
    tag: 'organic',
  },
  {
    id: 'v6',
    title: {
      mr: 'APMC दलालांशी घासाघीस — टिप्स',
      en: 'Negotiating with APMC brokers — tips',
    },
    channel: 'Bazaar Bolto',
    durationMin: 9,
    thumb: 'market',
    url: 'https://www.youtube.com/results?search_query=apmc+broker+tips+marathi',
    tag: 'market',
  },
];

export function videoTitle(v: VideoTip, lang: Language): string {
  return v.title[lang];
}
