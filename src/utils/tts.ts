import type { Language } from '../types';

// Tiny wrapper around expo-speech so callers can `speak()` without worrying
// about whether the library is installed. Falls back to a silent no-op when
// the native module isn't in the runtime (eg. Expo Go without dev client).

type SpeechModule = {
  speak: (text: string, opts?: { language?: string }) => void;
  stop: () => void;
  isSpeakingAsync: () => Promise<boolean>;
};

let _module: SpeechModule | null | undefined;

function load(): SpeechModule | null {
  if (_module !== undefined) return _module;
  try {
    _module = require('expo-speech') as SpeechModule;
  } catch {
    _module = null;
  }
  return _module;
}

export function isTtsAvailable(): boolean {
  return load() !== null;
}

const LOCALE: Record<Language, string> = {
  mr: 'mr-IN',
  en: 'en-IN',
};

export function speak(text: string, lang: Language): void {
  const mod = load();
  if (!mod) return;
  try {
    mod.stop();
    mod.speak(text, { language: LOCALE[lang] });
  } catch {
    // Intentional: TTS is purely additive.
  }
}

export function stopSpeaking(): void {
  const mod = load();
  if (!mod) return;
  try {
    mod.stop();
  } catch {
    // ignore
  }
}
