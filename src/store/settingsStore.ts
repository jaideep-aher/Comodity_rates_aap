import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Language } from '../types';
import { DICT, type Dict } from '../i18n';

type PriceUnit = 'qtl' | 'kg';
type Numerals = 'auto' | 'deva' | 'latin';

type SettingsState = {
  language: Language;
  unit: PriceUnit;
  numerals: Numerals;
  onboardingDone: boolean;
  name: string;
  village: string;
  setLanguage: (lang: Language) => void;
  setUnit: (unit: PriceUnit) => void;
  setNumerals: (n: Numerals) => void;
  setOnboardingDone: (v: boolean) => void;
  setName: (v: string) => void;
  setVillage: (v: string) => void;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'mr',
      // Default to per-kg — that's how a small farmer thinks. Power users can
      // toggle to /quintal in Profile.
      unit: 'kg',
      numerals: 'auto',
      onboardingDone: false,
      name: '',
      village: '',
      setLanguage: (language) => set({ language }),
      setUnit: (unit) => set({ unit }),
      setNumerals: (numerals) => set({ numerals }),
      setOnboardingDone: (onboardingDone) => set({ onboardingDone }),
      setName: (name) => set({ name }),
      setVillage: (village) => set({ village }),
    }),
    {
      name: 'bajarbhav:settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export function useDict(): Dict {
  const lang = useSettings((s) => s.language);
  return DICT[lang];
}

// Resolve which numeric script to render.
// "auto" → Devanagari when language is mr, Latin otherwise.
export function useNumeralLang(): Language {
  const lang = useSettings((s) => s.language);
  const numerals = useSettings((s) => s.numerals);
  if (numerals === 'deva') return 'mr';
  if (numerals === 'latin') return 'en';
  return lang;
}
