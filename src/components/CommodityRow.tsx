import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, spacing } from '../theme';
import type { CommodityWithPrice } from '../types';
import { emojiFor } from '../utils/icons';
import { formatRupees, formatRupeesPerKg } from '../utils/format';
import { DeltaPill } from './DeltaPill';
import { Sparkline } from './Sparkline';
import { useSettings } from '../store/settingsStore';
import { useWatchlist } from '../store/watchlistStore';

type Props = {
  item: CommodityWithPrice;
  onPress: () => void;
};

export function CommodityRow({ item, onPress }: Props) {
  const lang = useSettings((s) => s.language);
  const unit = useSettings((s) => s.unit);
  const starred = useWatchlist((s) => s.ids.includes(item.id));
  const toggle = useWatchlist((s) => s.toggle);
  const hasPrice = item.today.avg > 0;
  const priceText = hasPrice
    ? unit === 'kg'
      ? formatRupeesPerKg(item.today.avg, lang)
      : formatRupees(item.today.avg)
    : '—';
  const unitSuffix = unit === 'qtl' && hasPrice ? (lang === 'mr' ? '/क्विं' : '/qtl') : '';

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.primaryLight }]}
      onPress={onPress}
    >
      <Text style={styles.emoji}>{emojiFor(item.iconKey)}</Text>
      <View style={styles.middle}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name[lang]}
        </Text>
        <View style={styles.meta}>
          {hasPrice && <DeltaPill deltaPct={item.deltaPct} size="sm" />}
          <Text style={styles.arrival}>
            {lang === 'mr' ? 'आवक' : 'Arr.'} {item.today.arrival.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>
      <View style={styles.right}>
        <View style={styles.priceBlock}>
          <Text style={styles.price}>{priceText}</Text>
          {unit === 'qtl' && hasPrice && <Text style={styles.unit}>{unitSuffix}</Text>}
        </View>
        {hasPrice && <Sparkline data={item.spark} width={60} height={22} />}
      </View>
      <Pressable hitSlop={10} onPress={() => toggle(item.id)} style={styles.star}>
        <Text style={[styles.starIcon, starred && { color: colors.accent }]}>
          {starred ? '★' : '☆'}
        </Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  emoji: { fontSize: 28, width: 36 },
  middle: { flex: 1, minWidth: 0 },
  name: { fontSize: font.md, fontWeight: '600', color: colors.text },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  arrival: { fontSize: font.xs, color: colors.textMuted },
  right: { alignItems: 'flex-end', gap: 2 },
  priceBlock: { flexDirection: 'row', alignItems: 'baseline' },
  price: { fontSize: font.lg, fontWeight: '700', color: colors.text },
  unit: { fontSize: font.xs, color: colors.textMuted, marginLeft: 2 },
  star: { paddingLeft: spacing.sm },
  starIcon: { fontSize: 24, color: colors.textSubtle },
});
