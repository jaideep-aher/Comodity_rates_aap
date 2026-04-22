import type { LocalizedName } from '../types';

export type StageKey = 'sowing' | 'germination' | 'vegetative' | 'flowering' | 'fruiting' | 'harvest';

export type Stage = {
  key: StageKey;
  // Day offset from sowing at which this stage STARTS.
  fromDay: number;
  emoji: string;
  name: LocalizedName;
  // One-line Marathi hint for farmer while in this stage.
  hint: LocalizedName;
};

export type CropLifecycle = {
  // Total days from sowing to end-of-harvest window.
  totalDays: number;
  // Typical yield in quintals per acre — drives the profit countdown.
  yieldQtlPerAcre: number;
  stages: Stage[];
};

// Keyed by commodity iconKey so we can share lifecycles across
// related slugs (tomato-1, tomato-2, etc.).
const LIFECYCLES: Record<string, CropLifecycle> = {
  tomato: {
    totalDays: 90,
    yieldQtlPerAcre: 180,
    stages: [
      { key: 'sowing', fromDay: 0, emoji: '🌱',
        name: { mr: 'पेरणी / लागवड', en: 'Sowing / transplant' },
        hint: { mr: 'बीज प्रक्रिया करा, गादी वाफा तयार.', en: 'Treat seed & prepare raised beds.' } },
      { key: 'germination', fromDay: 5, emoji: '🌿',
        name: { mr: 'उगवण', en: 'Germination' },
        hint: { mr: 'हलके पाणी रोज, उष्णतेपासून संरक्षण.', en: 'Light daily watering; protect from heat.' } },
      { key: 'vegetative', fromDay: 15, emoji: '🪴',
        name: { mr: 'वाढीचा टप्पा', en: 'Vegetative growth' },
        hint: { mr: '१९:१९:१९ खत द्या. काठी आधार लावा.', en: 'Apply 19:19:19 & stake plants.' } },
      { key: 'flowering', fromDay: 40, emoji: '🌸',
        name: { mr: 'फुलोरा', en: 'Flowering' },
        hint: { mr: 'पाणी तुटू देऊ नका. फुलकिडीवर लक्ष.', en: 'Keep watering steady; watch for thrips.' } },
      { key: 'fruiting', fromDay: 55, emoji: '🍅',
        name: { mr: 'फळधारणा', en: 'Fruit set' },
        hint: { mr: '१२:३२:१६ व पोटॅश वाढवा.', en: 'Boost K with 12:32:16 and MOP.' } },
      { key: 'harvest', fromDay: 70, emoji: '🧺',
        name: { mr: 'काढणी', en: 'Harvest' },
        hint: { mr: '२-३ दिवसांआड तोडणी. सकाळी काढा.', en: 'Pick every 2–3 days, preferably mornings.' } },
    ],
  },
  onion: {
    totalDays: 140,
    yieldQtlPerAcre: 120,
    stages: [
      { key: 'sowing', fromDay: 0, emoji: '🌱',
        name: { mr: 'रोपवाटिका', en: 'Nursery' },
        hint: { mr: 'रोपवाटिकेत ६-८ आठवडे.', en: '6–8 weeks in nursery bed.' } },
      { key: 'germination', fromDay: 45, emoji: '🌿',
        name: { mr: 'पुनर्लागवड', en: 'Transplant' },
        hint: { mr: 'सायंकाळी लागवड करा, पाणी द्या.', en: 'Transplant in evening, then irrigate.' } },
      { key: 'vegetative', fromDay: 60, emoji: '🪴',
        name: { mr: 'वाढीचा टप्पा', en: 'Leaf growth' },
        hint: { mr: 'नत्र द्या. तण काढा.', en: 'Nitrogen top-dress; weed.' } },
      { key: 'flowering', fromDay: 90, emoji: '🧄',
        name: { mr: 'कांदा गोल होणे', en: 'Bulb formation' },
        hint: { mr: 'पोटॅश वाढवा. पाणी कमी करा.', en: 'Increase potash; reduce watering.' } },
      { key: 'fruiting', fromDay: 115, emoji: '🧅',
        name: { mr: 'परिपक्वता', en: 'Maturation' },
        hint: { mr: 'पाणी बंद. पात झुकू द्या.', en: 'Stop irrigation. Let tops fall over.' } },
      { key: 'harvest', fromDay: 130, emoji: '🧺',
        name: { mr: 'काढणी व सुकवण', en: 'Harvest & cure' },
        hint: { mr: '७ दिवस शेतात सुकवा.', en: 'Cure in the field for 7 days.' } },
    ],
  },
  potato: {
    totalDays: 100,
    yieldQtlPerAcre: 100,
    stages: [
      { key: 'sowing', fromDay: 0, emoji: '🌱', name: { mr: 'लागवड', en: 'Planting' },
        hint: { mr: 'बीजप्रक्रिया करून सरी पाडा.', en: 'Treat tubers; plant on ridges.' } },
      { key: 'germination', fromDay: 10, emoji: '🌿', name: { mr: 'अंकुरण', en: 'Sprouting' },
        hint: { mr: 'माती हलकी ठेवा. पहिले पाणी.', en: 'Keep soil loose; first irrigation.' } },
      { key: 'vegetative', fromDay: 25, emoji: '🪴', name: { mr: 'वाढ', en: 'Canopy growth' },
        hint: { mr: 'भर द्या. तण नियंत्रण.', en: 'Earth up; control weeds.' } },
      { key: 'flowering', fromDay: 50, emoji: '🌸', name: { mr: 'फुलोरा', en: 'Flowering' },
        hint: { mr: 'फुलं आल्यावर पाण्याचा ताण टाळा.', en: 'Do not water-stress at flowering.' } },
      { key: 'fruiting', fromDay: 70, emoji: '🥔', name: { mr: 'कंद भरणे', en: 'Tuber bulking' },
        hint: { mr: 'पोटॅश द्या. शेवटचे पाणी.', en: 'Top-dress potash; final irrigation.' } },
      { key: 'harvest', fromDay: 90, emoji: '🧺', name: { mr: 'काढणी', en: 'Harvest' },
        hint: { mr: 'पात सुकल्यावर काढणी करा.', en: 'Harvest once vines dry.' } },
    ],
  },
  chili: {
    totalDays: 120,
    yieldQtlPerAcre: 60,
    stages: [
      { key: 'sowing', fromDay: 0, emoji: '🌱', name: { mr: 'रोपवाटिका', en: 'Nursery' },
        hint: { mr: 'ट्रेमध्ये बीज लावा.', en: 'Raise seedlings in trays.' } },
      { key: 'germination', fromDay: 25, emoji: '🌿', name: { mr: 'पुनर्लागवड', en: 'Transplant' },
        hint: { mr: 'ढगाळ दिवशी लागवड.', en: 'Transplant on an overcast day.' } },
      { key: 'vegetative', fromDay: 35, emoji: '🪴', name: { mr: 'वाढ', en: 'Vegetative' },
        hint: { mr: 'ठिबक + १९:१९:१९.', en: 'Drip + 19:19:19.' } },
      { key: 'flowering', fromDay: 60, emoji: '🌸', name: { mr: 'फुलोरा', en: 'Flowering' },
        hint: { mr: 'फुलगळ टाळण्यासाठी सूक्ष्म अन्न.', en: 'Foliar micros to prevent flower drop.' } },
      { key: 'fruiting', fromDay: 80, emoji: '🌶️', name: { mr: 'फळधारणा', en: 'Fruit set' },
        hint: { mr: 'थ्रिप्स व मिरची माइट्सवर लक्ष.', en: 'Watch thrips & chili mites.' } },
      { key: 'harvest', fromDay: 100, emoji: '🧺', name: { mr: 'काढणी', en: 'Harvest' },
        hint: { mr: '७-१० दिवसांआड तोडणी.', en: 'Pick every 7–10 days.' } },
    ],
  },
  wheat: {
    totalDays: 125,
    yieldQtlPerAcre: 18,
    stages: [
      { key: 'sowing', fromDay: 0, emoji: '🌱', name: { mr: 'पेरणी', en: 'Sowing' },
        hint: { mr: 'ओलिताखाली पेरा.', en: 'Sow under irrigation.' } },
      { key: 'germination', fromDay: 7, emoji: '🌿', name: { mr: 'उगवण', en: 'Germination' },
        hint: { mr: 'पहिले पाणी २१ दिवसांनी.', en: 'First irrigation at ~21 days.' } },
      { key: 'vegetative', fromDay: 30, emoji: '🪴', name: { mr: 'फुटवा', en: 'Tillering' },
        hint: { mr: 'युरिया टॉप-ड्रेस.', en: 'Top-dress urea.' } },
      { key: 'flowering', fromDay: 65, emoji: '🌾', name: { mr: 'ओंबी येणे', en: 'Heading' },
        hint: { mr: 'पाणी आवश्यक.', en: 'Critical irrigation window.' } },
      { key: 'fruiting', fromDay: 90, emoji: '🌾', name: { mr: 'दाणे भरणे', en: 'Grain fill' },
        hint: { mr: 'मावा व तुडतुडे पहा.', en: 'Scout for aphids.' } },
      { key: 'harvest', fromDay: 115, emoji: '🧺', name: { mr: 'कापणी', en: 'Harvest' },
        hint: { mr: '२० % ओलावा आल्यावर कापा.', en: 'Cut at ~20% moisture.' } },
    ],
  },
  rice: {
    totalDays: 140,
    yieldQtlPerAcre: 22,
    stages: [
      { key: 'sowing', fromDay: 0, emoji: '🌱', name: { mr: 'रोपवाटिका', en: 'Nursery' },
        hint: { mr: 'बीज प्रक्रिया + नर्सरी.', en: 'Seed treat + nursery.' } },
      { key: 'germination', fromDay: 25, emoji: '🌿', name: { mr: 'लावणी', en: 'Transplant' },
        hint: { mr: 'चिखलणी नंतर लावणी.', en: 'Puddle, then transplant.' } },
      { key: 'vegetative', fromDay: 40, emoji: '🪴', name: { mr: 'फुटवा', en: 'Tillering' },
        hint: { mr: '५ सेमी पाणी ठेवा.', en: 'Maintain ~5 cm standing water.' } },
      { key: 'flowering', fromDay: 80, emoji: '🌾', name: { mr: 'लोंबी येणे', en: 'Panicle' },
        hint: { mr: 'पाणी तुटू देऊ नका.', en: 'Never let water stress occur.' } },
      { key: 'fruiting', fromDay: 105, emoji: '🌾', name: { mr: 'दाणे भरणे', en: 'Grain fill' },
        hint: { mr: 'करपा व तुडतुडे पहा.', en: 'Scout blast & BPH.' } },
      { key: 'harvest', fromDay: 130, emoji: '🧺', name: { mr: 'कापणी', en: 'Harvest' },
        hint: { mr: '८० % लोंबी पिवळ्या झाल्या.', en: '80% of panicles golden.' } },
    ],
  },
  default: {
    totalDays: 100,
    yieldQtlPerAcre: 60,
    stages: [
      { key: 'sowing', fromDay: 0, emoji: '🌱', name: { mr: 'पेरणी', en: 'Sowing' },
        hint: { mr: 'बीज प्रक्रिया करा.', en: 'Treat seed before sowing.' } },
      { key: 'germination', fromDay: 8, emoji: '🌿', name: { mr: 'उगवण', en: 'Germination' },
        hint: { mr: 'हलके नियमित पाणी.', en: 'Light regular watering.' } },
      { key: 'vegetative', fromDay: 25, emoji: '🪴', name: { mr: 'वाढ', en: 'Vegetative' },
        hint: { mr: 'नत्र + तण नियंत्रण.', en: 'Nitrogen + weeding.' } },
      { key: 'flowering', fromDay: 50, emoji: '🌸', name: { mr: 'फुलोरा', en: 'Flowering' },
        hint: { mr: 'पाणी नियमित ठेवा.', en: 'Keep irrigation steady.' } },
      { key: 'fruiting', fromDay: 65, emoji: '🫛', name: { mr: 'फळधारणा', en: 'Fruit set' },
        hint: { mr: 'पोटॅश वाढवा.', en: 'Increase potash.' } },
      { key: 'harvest', fromDay: 85, emoji: '🧺', name: { mr: 'काढणी', en: 'Harvest' },
        hint: { mr: 'हंगामानुसार काढणी.', en: 'Harvest at maturity.' } },
    ],
  },
};

export function lifecycleFor(iconKey: string, varietyId?: string | null): CropLifecycle {
  const base = LIFECYCLES[iconKey] ?? LIFECYCLES.default;
  if (!varietyId) return base;
  // Lazy require to avoid a circular import with varieties.ts.
  let override: { totalDaysOverride?: number; yieldQtlPerAcre?: number } | null = null;
  try {
    const { findVariety } = require('./varieties') as typeof import('./varieties');
    override = findVariety(iconKey, varietyId);
  } catch {
    override = null;
  }
  if (!override) return base;
  if (!override.totalDaysOverride && !override.yieldQtlPerAcre) return base;

  const scale = override.totalDaysOverride
    ? override.totalDaysOverride / base.totalDays
    : 1;
  return {
    totalDays: override.totalDaysOverride ?? base.totalDays,
    yieldQtlPerAcre: override.yieldQtlPerAcre ?? base.yieldQtlPerAcre,
    stages: base.stages.map((s) => ({ ...s, fromDay: Math.round(s.fromDay * scale) })),
  };
}

export function stageAt(iconKey: string, daysSinceSowing: number, varietyId?: string | null): Stage {
  const { stages } = lifecycleFor(iconKey, varietyId);
  let current = stages[0];
  for (const s of stages) {
    if (daysSinceSowing >= s.fromDay) current = s;
    else break;
  }
  return current;
}

export function daysToHarvest(
  iconKey: string,
  daysSinceSowing: number,
  varietyId?: string | null,
): number {
  const { totalDays } = lifecycleFor(iconKey, varietyId);
  return Math.max(0, totalDays - daysSinceSowing);
}
