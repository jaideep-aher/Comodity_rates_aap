import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, shadow, spacing } from '../theme';
import { useDict, useSettings } from '../store/settingsStore';
import { COMMODITIES } from '../data/commodities';
import { calendarFor, monthLabel } from '../data/cropCalendar';
import { emojiFor } from '../utils/icons';

type Props = {
  onOpenDetail: (slug: string) => void;
};

// Shows crops whose sowing window covers the current calendar month. Uses the
// existing cropCalendar data to stay mock-only for Stage 5.
export function SowNowStrip({ onOpenDetail }: Props) {
  const t = useDict();
  const lang = useSettings((s) => s.language);
  const month = new Date().getMonth() + 1;

  // De-dupe by iconKey so "tomato-1" and "tomato-2" collapse to one tile.
  const seen = new Set<string>();
  const matches = COMMODITIES.filter((c) => {
    if (seen.has(c.iconKey)) return false;
    const cal = calendarFor(c.iconKey);
    if (!cal.sowing.months.includes(month)) return false;
    seen.add(c.iconKey);
    return true;
  }).slice(0, 10);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>🌱  {t.sowNowTitle}</Text>
      <Text style={styles.subtitle}>{t.sowNowSubtitle(monthLabel(month, lang))}</Text>
      {matches.length === 0 ? (
        <Text style={styles.empty}>{t.sowNowEmpty}</Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {matches.map((c) => (
            <Pressable
              key={c.id}
              style={styles.tile}
              onPress={() => onOpenDetail(c.slug)}
            >
              <Text style={styles.tileEmoji}>{emojiFor(c.iconKey)}</Text>
              <Text style={styles.tileName} numberOfLines={2}>
                {c.name[lang]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primarySoft,
  },
  title: { fontSize: font.md, fontWeight: '800', color: colors.primaryDark },
  subtitle: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },
  empty: { marginTop: spacing.sm, fontSize: font.sm, color: colors.textMuted },
  row: { paddingTop: spacing.sm, gap: spacing.sm, paddingRight: spacing.md },
  tile: {
    width: 94,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.sm,
    ...shadow.soft,
  },
  tileEmoji: { fontSize: 36 },
  tileName: {
    marginTop: 4,
    fontSize: font.xs,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
});
