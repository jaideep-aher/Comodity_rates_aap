import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, shadow, spacing } from '../theme';
import { calendarFor, monthLabel } from '../data/cropCalendar';
import { useDict, useSettings } from '../store/settingsStore';

type Props = { iconKey: string };

// Compact month-grid calendar.  Highlights sowing months green and harvest
// months saffron.  Months that are both (rare) get a diagonal split via
// stacking two backgrounds.
export function CropCalendarCard({ iconKey }: Props) {
  const t = useDict();
  const lang = useSettings((s) => s.language);
  const cal = calendarFor(iconKey);
  const sowing = new Set(cal.sowing.months);
  const harvest = new Set(cal.harvest.months);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t.detailCalendarTitle}</Text>

      <View style={styles.grid}>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
          const isSow = sowing.has(m);
          const isHarv = harvest.has(m);
          const bg = isSow && isHarv
            ? colors.saffronSoft
            : isSow
              ? colors.primarySoft
              : isHarv
                ? colors.saffronSoft
                : colors.bg;
          const fg = isSow
            ? colors.primaryDark
            : isHarv
              ? colors.saffron
              : colors.textSubtle;
          return (
            <View key={m} style={[styles.cell, { backgroundColor: bg }]}>
              {isSow && <View style={[styles.bandTop, { backgroundColor: colors.primary }]} />}
              {isHarv && <View style={[styles.bandBottom, { backgroundColor: colors.saffron }]} />}
              <Text style={[styles.month, { color: fg }]}>{monthLabel(m, lang)}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>{t.detailCalendarSowing}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.saffron }]} />
          <Text style={styles.legendText}>{t.detailCalendarHarvest}</Text>
        </View>
      </View>

      <Text style={styles.note}>{cal.notes[lang]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadow.card,
  },
  title: { fontSize: font.md, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  cell: {
    width: '15%',
    aspectRatio: 1.1,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  month: { fontSize: font.xs, fontWeight: '700' },
  bandTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
  },
  bandBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
  },
  legend: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: font.xs, color: colors.textMuted },
  note: {
    marginTop: spacing.sm,
    fontSize: font.sm,
    color: colors.textMuted,
    lineHeight: 20,
  },
});
