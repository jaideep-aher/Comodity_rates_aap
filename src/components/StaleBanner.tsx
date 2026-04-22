import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, spacing } from '../theme';
import { useSettings } from '../store/settingsStore';

type Props = {
  date: string;
};

export function StaleBanner({ date }: Props) {
  const lang = useSettings((s) => s.language);
  const label =
    lang === 'mr'
      ? `आजचे नवीन भाव अजून उपलब्ध नाहीत. शेवटचे भाव: ${formatDate(date, 'mr')}`
      : `Today's new prices aren't in yet. Showing last available: ${formatDate(date, 'en')}`;
  return (
    <View style={styles.wrap}>
      <Text style={styles.icon}>⏳</Text>
      <Text style={styles.text} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

function formatDate(iso: string, lang: 'mr' | 'en'): string {
  try {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString(lang === 'mr' ? 'mr-IN' : 'en-IN', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return iso;
  }
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: '#FEF3C7',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  icon: { fontSize: font.lg, marginRight: spacing.sm },
  text: { flex: 1, fontSize: font.sm, color: '#78350F' },
});
