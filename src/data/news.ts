import type { Language } from '../types';

export type NewsItem = {
  id: string;
  title: { mr: string; en: string };
  summary: { mr: string; en: string };
  source: string;
  date: string;
  tag: 'market' | 'weather' | 'scheme' | 'crop';
  url?: string;
};

// Curated Marathi-first news feed. In production these arrive via a backend
// endpoint fed by an RSS aggregator (Agrowon, Krishi Jagran, etc.).
export const NEWS: NewsItem[] = [
  {
    id: 'n1',
    title: {
      mr: 'कांदा निर्यातीवरील शुल्क रद्द — भाव वाढण्याची शक्यता',
      en: 'Onion export duty scrapped — prices likely to firm up',
    },
    summary: {
      mr: 'केंद्र सरकारने कांदा निर्यातीवरील ४०% शुल्क काढून टाकले आहे. नाशिक व लासलगाव व्यापाऱ्यांनी स्वागत केले.',
      en: 'The Union government has withdrawn the 40% export duty on onions. Traders in Nashik and Lasalgaon have welcomed the move.',
    },
    source: 'Agrowon',
    date: '2026-04-21',
    tag: 'market',
  },
  {
    id: 'n2',
    title: {
      mr: 'पीएम-किसान १८ वा हप्ता जून मध्ये जमा होण्याची शक्यता',
      en: 'PM-Kisan 18th instalment likely to hit accounts in June',
    },
    summary: {
      mr: 'पात्र शेतकऱ्यांच्या बँक खात्यात ₹२,००० जमा होतील. eKYC व आधार लिंकिंग पूर्ण असणे आवश्यक.',
      en: 'Eligible farmers will receive ₹2,000 in their bank accounts. Ensure eKYC and Aadhaar linking are complete.',
    },
    source: 'PIB',
    date: '2026-04-20',
    tag: 'scheme',
  },
  {
    id: 'n3',
    title: {
      mr: 'एप्रिलअखेर महाराष्ट्रात हलका पाऊस — टोमॅटोला धोका',
      en: 'Light rain in Maharashtra end-April — tomato at risk',
    },
    summary: {
      mr: 'भारतीय हवामान विभागाने येत्या ४८ तासांत कोकण व पश्चिम महाराष्ट्रात हलका ते मध्यम पाऊस अपेक्षित असल्याचे सांगितले.',
      en: 'IMD forecasts light-to-moderate rain over Konkan and western Maharashtra in the next 48 hours.',
    },
    source: 'IMD',
    date: '2026-04-19',
    tag: 'weather',
  },
  {
    id: 'n4',
    title: {
      mr: 'हमीभावावर तूर खरेदी सुरू — नोंदणी ३० एप्रिलपर्यंत',
      en: 'Tur procurement at MSP open — register by April 30',
    },
    summary: {
      mr: 'NAFED केंद्रांवर तूर डाळीसाठी हमीभावाने खरेदी सुरू. जवळच्या खरेदी केंद्रावर जाऊन नोंदणी करा.',
      en: 'NAFED has opened MSP procurement for tur dal. Register at the nearest centre before month-end.',
    },
    source: 'NAFED',
    date: '2026-04-18',
    tag: 'scheme',
  },
  {
    id: 'n5',
    title: {
      mr: 'पाण्याच्या टंचाईमुळे भेंडी उत्पादन घटले — भाव चढेच',
      en: 'Water stress cuts okra yields — prices stay firm',
    },
    summary: {
      mr: 'मराठवाडा व विदर्भातील उष्णतेच्या लाटेचा परिणाम. पुणे APMC मध्ये मागील आठवड्यात भेंडीचा सरासरी भाव ७% ने वाढला.',
      en: 'Heatwave in Marathwada and Vidarbha has hit okra yields. Average prices at Pune APMC rose 7% over the past week.',
    },
    source: 'Krishi Jagran',
    date: '2026-04-17',
    tag: 'crop',
  },
];

export function newsTitle(n: NewsItem, lang: Language): string {
  return n.title[lang];
}
export function newsSummary(n: NewsItem, lang: Language): string {
  return n.summary[lang];
}
