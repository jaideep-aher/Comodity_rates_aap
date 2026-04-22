import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, font, radius, spacing } from '../theme';
import { useSettings } from '../store/settingsStore';
import { isTtsAvailable, speak, stopSpeaking } from '../utils/tts';

type Props = {
  // Text to read aloud. Pass it pre-composed in the active language.
  text: string;
  compact?: boolean;
};

// Pill-shaped play/stop control that degrades to a no-op (hidden) when
// expo-speech isn't available in the runtime.
export function TtsButton({ text, compact }: Props) {
  const lang = useSettings((s) => s.language);
  const [playing, setPlaying] = useState(false);

  useEffect(() => () => stopSpeaking(), []);

  if (!isTtsAvailable()) return null;

  const onPress = () => {
    if (playing) {
      stopSpeaking();
      setPlaying(false);
      return;
    }
    speak(text, lang);
    setPlaying(true);
    // No onDone callback wired — stop automatically after a reasonable time.
    setTimeout(() => setPlaying(false), Math.max(3000, text.length * 80));
  };

  return (
    <Pressable
      onPress={onPress}
      style={[styles.btn, compact && styles.btnCompact]}
      hitSlop={8}
    >
      <Text style={styles.icon}>{playing ? '⏸' : '🔊'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnCompact: { width: 28, height: 28 },
  icon: { fontSize: font.md, color: colors.primary },
});

export const TTS_SPACING = spacing.sm;
