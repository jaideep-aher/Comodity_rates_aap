import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, shadow, spacing } from '../theme';
import { useDict, useSettings, useNumeralLang } from '../store/settingsStore';
import { useCropInstances, daysSince } from '../store/cropInstancesStore';
import { lifecycleFor, stageAt, daysToHarvest } from '../data/cropStages';
import type { CommodityWithPrice } from '../types';
import { localiseNumber } from '../utils/format';

type Props = {
  items: CommodityWithPrice[];
  onOpenDetail: (slug: string) => void;
};

// Renders a list of countdown cards — one per watchlisted commodity that has
// a sowing date. Silent when no crops are anchored.
export function DaysToHarvestCard({ items, onOpenDetail }: Props) {
  const t = useDict();
  const lang = useSettings((s) => s.language);
  const nLang = useNumeralLang();
  const instances = useCropInstances((s) => s.byId);

  const rows = items
    .map((c) => {
      const inst = instances[c.id];
      if (!inst?.sowingDate) return null;
      const days = daysSince(inst.sowingDate);
      const remaining = daysToHarvest(c.iconKey, days, inst.variety);
      const stage = stageAt(c.iconKey, days, inst.variety);
      const lifecycle = lifecycleFor(c.iconKey, inst.variety);
      const yieldQtl = lifecycle.yieldQtlPerAcre * (inst.areaAcres ?? 1);
      const revLow = Math.round(c.today.min * yieldQtl);
      const revHigh = Math.round(c.today.max * yieldQtl);
      return { c, inst, days, remaining, stage, revLow, revHigh };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (rows.length === 0) return null;

  return (
    <View style={styles.wrap}>
      {rows.map(({ c, inst, remaining, stage, revLow, revHigh }) => {
        const ready = remaining === 0;
        const pct = Math.max(
          0,
          Math.min(
            100,
            100 - (remaining / lifecycleFor(c.iconKey, inst.variety).totalDays) * 100,
          ),
        );
        return (
          <Pressable
            key={c.id}
            style={styles.card}
            onPress={() => onOpenDetail(c.slug)}
          >
            <View style={styles.headerRow}>
              <Text style={styles.emoji}>{stage.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>
                  {c.name[lang]}
                </Text>
                <Text style={styles.stageName}>{stage.name[lang]}</Text>
              </View>
              <View style={styles.daysBox}>
                <Text style={styles.daysNum}>
                  {ready ? '✓' : localiseNumber(remaining, nLang)}
                </Text>
                <Text style={styles.daysLabel}>
                  {ready
                    ? t.countdownReady
                    : lang === 'mr' ? 'दिवस बाकी' : 'days to go'}
                </Text>
              </View>
            </View>

            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${pct}%` }]} />
            </View>

            {!ready && c.today.avg > 0 && (
              <Text style={styles.revenue}>
                💰{' '}
                {lang === 'mr'
                  ? `अंदाजे उत्पन्न: ₹${localiseNumber(revLow, nLang)}–${localiseNumber(revHigh, nLang)}`
                  : `Est. revenue: ₹${localiseNumber(revLow, nLang)}–${localiseNumber(revHigh, nLang)}`}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.md, gap: spacing.sm },
  card: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    ...shadow.card,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  emoji: { fontSize: 36 },
  name: { fontSize: font.md, fontWeight: '800', color: colors.text },
  stageName: { fontSize: font.xs, color: colors.primaryDark, marginTop: 2, fontWeight: '700' },
  daysBox: { alignItems: 'flex-end' },
  daysNum: { fontSize: font.xxl, fontWeight: '800', color: colors.primary },
  daysLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '700' },

  barTrack: {
    marginTop: spacing.sm,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.bgAlt,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  revenue: {
    marginTop: spacing.sm,
    fontSize: font.sm,
    color: colors.text,
    fontWeight: '700',
  },
});
