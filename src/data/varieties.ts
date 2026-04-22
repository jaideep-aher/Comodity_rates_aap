import type { LocalizedName } from '../types';

// Variety-specific agronomy tweaks. Each variety can override the base crop
// lifecycle (eg. Pusa Ruby tomatoes ripen ~15 days earlier than the iconKey
// default). The Stage 5 lifecycle engine falls back to iconKey defaults when
// a variety isn't picked.
export type Variety = {
  id: string;
  name: LocalizedName;
  // Optional override: days from sowing to end of harvest.
  totalDaysOverride?: number;
  // Typical yield per acre for this variety (quintals).
  yieldQtlPerAcre?: number;
  // One-line marketing note — shown under the variety in pickers.
  blurb: LocalizedName;
};

// Keyed by commodity iconKey.
const TABLE: Record<string, Variety[]> = {
  tomato: [
    { id: 'pusa-ruby', name: { mr: 'पुसा रुबी', en: 'Pusa Ruby' },
      totalDaysOverride: 80, yieldQtlPerAcre: 160,
      blurb: { mr: 'लवकर तयार. साधारण २० किलो/रोप.', en: 'Early, ~20 kg/plant.' } },
    { id: 'arka-rakshak', name: { mr: 'अर्का रक्षक', en: 'Arka Rakshak' },
      totalDaysOverride: 95, yieldQtlPerAcre: 200,
      blurb: { mr: 'तीन रोगप्रतिकारक. भरघोस उत्पादन.', en: 'Triple-disease resistant, high yield.' } },
    { id: 'sahoo', name: { mr: 'साहू संकरित', en: 'Sahoo hybrid' },
      totalDaysOverride: 90, yieldQtlPerAcre: 180,
      blurb: { mr: 'बाजारात मोठा आकार, लांब साठवण.', en: 'Large fruits, long shelf life.' } },
  ],
  onion: [
    { id: 'nashik-red', name: { mr: 'नाशिक लाल (N-53)', en: 'Nashik Red (N-53)' },
      totalDaysOverride: 140, yieldQtlPerAcre: 120,
      blurb: { mr: 'रब्बी हंगाम, साठवण उत्तम.', en: 'Rabi, excellent storage.' } },
    { id: 'baswant-780', name: { mr: 'बसवंत ७८०', en: 'Baswant 780' },
      totalDaysOverride: 130, yieldQtlPerAcre: 140,
      blurb: { mr: 'खरीप. तिखट चव, मोठा आकार.', en: 'Kharif, pungent & large.' } },
    { id: 'phule-samarth', name: { mr: 'फुले समर्थ', en: 'Phule Samarth' },
      totalDaysOverride: 135, yieldQtlPerAcre: 130,
      blurb: { mr: 'खरीप-रब्बी दोन्ही, थ्रिप्सला बरा.', en: 'Both seasons, thrips-tolerant.' } },
  ],
  potato: [
    { id: 'kufri-jyoti', name: { mr: 'कुफरी ज्योती', en: 'Kufri Jyoti' },
      totalDaysOverride: 100, yieldQtlPerAcre: 110,
      blurb: { mr: 'लांब साठवण, टेबल वापर.', en: 'Long storage, table use.' } },
    { id: 'kufri-pukhraj', name: { mr: 'कुफरी पुखराज', en: 'Kufri Pukhraj' },
      totalDaysOverride: 85, yieldQtlPerAcre: 120,
      blurb: { mr: 'लवकर, कमी पाण्यात.', en: 'Early, low-water-friendly.' } },
  ],
  chili: [
    { id: 'pusa-jwala', name: { mr: 'पुसा ज्वाला', en: 'Pusa Jwala' },
      totalDaysOverride: 110, yieldQtlPerAcre: 55,
      blurb: { mr: 'हिरवी व लाल दोन्ही.', en: 'Green & red dual-use.' } },
    { id: 'agnirekha', name: { mr: 'अग्निरेखा', en: 'Agnirekha' },
      totalDaysOverride: 120, yieldQtlPerAcre: 65,
      blurb: { mr: 'तीव्र तिखट, वाळवणीस उत्तम.', en: 'Hot, good for drying.' } },
  ],
  wheat: [
    { id: 'hd-2967', name: { mr: 'HD-२९६७', en: 'HD-2967' },
      totalDaysOverride: 125, yieldQtlPerAcre: 20,
      blurb: { mr: 'बहुतांश भारतभर शिफारस.', en: 'Widely recommended pan-India.' } },
    { id: 'lokvan', name: { mr: 'लोकवान (MACS-6478)', en: 'Lokvan (MACS-6478)' },
      totalDaysOverride: 115, yieldQtlPerAcre: 18,
      blurb: { mr: 'महाराष्ट्रासाठी पारंपरिक.', en: 'Traditional Maharashtra pick.' } },
  ],
  rice: [
    { id: 'indrayani', name: { mr: 'इंद्रायणी', en: 'Indrayani' },
      totalDaysOverride: 135, yieldQtlPerAcre: 22,
      blurb: { mr: 'सुगंधित, पश्चिम महाराष्ट्र.', en: 'Aromatic, west MH.' } },
    { id: 'ambemohar', name: { mr: 'आंबेमोहोर', en: 'Ambemohar' },
      totalDaysOverride: 145, yieldQtlPerAcre: 18,
      blurb: { mr: 'प्रीमियम सुगंध.', en: 'Premium aroma rice.' } },
  ],
};

export function varietiesFor(iconKey: string): Variety[] {
  return TABLE[iconKey] ?? [];
}

export function findVariety(iconKey: string, id: string | null): Variety | null {
  if (!id) return null;
  return varietiesFor(iconKey).find((v) => v.id === id) ?? null;
}
