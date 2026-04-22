import type { LocalizedName } from '../types';
import type { StageKey } from './cropStages';

export type TaskKind = 'irrigate' | 'spray' | 'fertilize' | 'weed' | 'harvest' | 'prune' | 'monitor';

export type TaskTemplate = {
  // Stable id (scoped per iconKey) so the "done" flag persists across renders.
  id: string;
  kind: TaskKind;
  // Day offset *within* the stage (0 = first day of stage).
  offsetInStage: number;
  title: LocalizedName;
  detail: LocalizedName;
};

export const KIND_EMOJI: Record<TaskKind, string> = {
  irrigate: '💧',
  spray: '🧪',
  fertilize: '🌱',
  weed: '🌾',
  harvest: '🧺',
  prune: '✂️',
  monitor: '🔍',
};

// Templates keyed by (iconKey, stage). "default" fallbacks cover crops we
// don't have bespoke templates for yet.
type TaskTable = Record<string, Partial<Record<StageKey, TaskTemplate[]>>>;

const TASKS: TaskTable = {
  tomato: {
    vegetative: [
      { id: 'tom-veg-1', kind: 'fertilize', offsetInStage: 2,
        title: { mr: 'खत — १९:१९:१९', en: 'Fertilise — 19:19:19' },
        detail: { mr: '२ किलो/एकर ठिबकमार्फत द्या.', en: '2 kg/acre via drip.' } },
      { id: 'tom-veg-2', kind: 'spray', offsetInStage: 5,
        title: { mr: 'फवारणी — मावा/पांढरी माशी', en: 'Spray — aphids & whitefly' },
        detail: { mr: 'नीम तेल ५ मिली/लि सकाळी फवारा.', en: 'Neem oil 5 ml/L, morning.' } },
      { id: 'tom-veg-3', kind: 'prune', offsetInStage: 8,
        title: { mr: 'काठी आधार व फांद्या बांधा', en: 'Stake & tie plants' },
        detail: { mr: 'तळाच्या फांद्या काढा, हवेसाठी जागा.', en: 'Strip lower branches for airflow.' } },
    ],
    flowering: [
      { id: 'tom-fl-1', kind: 'irrigate', offsetInStage: 0,
        title: { mr: 'सिंचन स्थिर ठेवा', en: 'Keep irrigation steady' },
        detail: { mr: 'पाण्याचा ताण = फुलगळ.', en: 'Stress = flower drop.' } },
      { id: 'tom-fl-2', kind: 'spray', offsetInStage: 3,
        title: { mr: 'फुलकिड्यांसाठी फवारणी', en: 'Thrips control spray' },
        detail: { mr: 'फिप्रोनिल १ मिली/लि.', en: 'Fipronil 1 ml/L.' } },
    ],
    fruiting: [
      { id: 'tom-fr-1', kind: 'fertilize', offsetInStage: 2,
        title: { mr: 'खत — १२:३२:१६', en: 'Fertilise — 12:32:16' },
        detail: { mr: '३ किलो/एकर + MOP २ किलो.', en: '3 kg/acre + MOP 2 kg.' } },
      { id: 'tom-fr-2', kind: 'monitor', offsetInStage: 5,
        title: { mr: 'फळमाशी सापळे', en: 'Fruit fly traps' },
        detail: { mr: 'फेरोमोन सापळे लावा.', en: 'Install pheromone traps.' } },
    ],
    harvest: [
      { id: 'tom-hv-1', kind: 'harvest', offsetInStage: 0,
        title: { mr: 'पहिली तोडणी', en: 'First pick' },
        detail: { mr: 'सकाळी ६-९ तोडणी, गार ठिकाणी ठेवा.', en: 'Pick 6–9 AM, store cool.' } },
    ],
  },
  onion: {
    vegetative: [
      { id: 'oni-veg-1', kind: 'fertilize', offsetInStage: 3,
        title: { mr: 'युरिया + सूक्ष्म अन्न', en: 'Urea + micros' },
        detail: { mr: 'युरिया २० किलो/एकर.', en: 'Urea 20 kg/acre.' } },
      { id: 'oni-veg-2', kind: 'weed', offsetInStage: 7,
        title: { mr: 'तण नियंत्रण', en: 'Weeding' },
        detail: { mr: 'हाताने / ऑक्सिफ्लोरफेन.', en: 'Manual or oxyfluorfen.' } },
    ],
    flowering: [
      { id: 'oni-fl-1', kind: 'fertilize', offsetInStage: 0,
        title: { mr: 'पोटॅश वाढवा', en: 'Boost potash' },
        detail: { mr: 'MOP २५ किलो/एकर.', en: 'MOP 25 kg/acre.' } },
      { id: 'oni-fl-2', kind: 'spray', offsetInStage: 5,
        title: { mr: 'थ्रिप्स फवारणी', en: 'Thrips spray' },
        detail: { mr: 'फिप्रोनिल किंवा लंबडा.', en: 'Fipronil / lambda-cyhalothrin.' } },
    ],
    fruiting: [
      { id: 'oni-fr-1', kind: 'irrigate', offsetInStage: 0,
        title: { mr: 'पाणी कमी करा', en: 'Taper irrigation' },
        detail: { mr: 'कंद भरू देण्यासाठी ताण आवश्यक.', en: 'Stress helps bulb fill.' } },
    ],
    harvest: [
      { id: 'oni-hv-1', kind: 'harvest', offsetInStage: 0,
        title: { mr: 'काढणी', en: 'Pull bulbs' },
        detail: { mr: '५० % पात झुकल्यावर.', en: 'When 50% of tops fall.' } },
      { id: 'oni-hv-2', kind: 'monitor', offsetInStage: 2,
        title: { mr: 'सुकवण', en: 'Field cure' },
        detail: { mr: '७ दिवस सावलीत सुकवा.', en: 'Shade-cure for 7 days.' } },
    ],
  },
  default: {
    vegetative: [
      { id: 'def-veg-1', kind: 'fertilize', offsetInStage: 3,
        title: { mr: 'नत्रयुक्त खत', en: 'Nitrogen top-dress' },
        detail: { mr: 'शिफारशीप्रमाणे द्या.', en: 'As per local recommendation.' } },
      { id: 'def-veg-2', kind: 'weed', offsetInStage: 7,
        title: { mr: 'तण काढा', en: 'Weed the field' },
        detail: { mr: 'पहिली निंदणी.', en: 'First weeding.' } },
    ],
    flowering: [
      { id: 'def-fl-1', kind: 'irrigate', offsetInStage: 0,
        title: { mr: 'पाणी नियमित', en: 'Keep irrigation steady' },
        detail: { mr: 'फुलोरा अवस्थेत ताण टाळा.', en: 'Avoid stress at flowering.' } },
    ],
    fruiting: [
      { id: 'def-fr-1', kind: 'fertilize', offsetInStage: 3,
        title: { mr: 'पोटॅश द्या', en: 'Apply potash' },
        detail: { mr: 'फळ / कंद भरणीसाठी.', en: 'For fill-up.' } },
    ],
    harvest: [
      { id: 'def-hv-1', kind: 'harvest', offsetInStage: 0,
        title: { mr: 'परिपक्वतेनुसार काढणी', en: 'Harvest at maturity' },
        detail: { mr: 'सकाळी काढणी करा.', en: 'Harvest in the cool morning.' } },
    ],
  },
};

export function tasksForStage(iconKey: string, stage: StageKey): TaskTemplate[] {
  return TASKS[iconKey]?.[stage] ?? TASKS.default[stage] ?? [];
}
