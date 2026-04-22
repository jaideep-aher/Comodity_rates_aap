import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, shadow, spacing } from '../theme';
import type { CommodityWithPrice } from '../types';
import { emojiFor } from '../utils/icons';
import { formatRupees, formatRupeesPerKg } from '../utils/format';
import { DeltaPill } from './DeltaPill';
import { Sparkline } from './Sparkline';
import { useSettings } from '../store/settingsStore';

type Props = {
  item: CommodityWithPrice;
  onPress: () => void;
};

export function WatchlistCard({ item, onPress }: Props) {
  const lang = useSettings((s) => s.language);
  const unit = useSettings((s) => s.unit);
  const hasPrice = item.today.avg > 0;
  const name = item.name[lang];
  const priceText = hasPrice
    ? unit === 'kg'
      ? formatRupeesPerKg(item.today.avg, lang)
      : formatRupees(item.today.avg)
    : '—';
  const unitSuffix = unit === 'qtl' ? (lang === 'mr' ? '/क्विं' : '/qtl') : '';

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]} onPress={onPress}>
      <View style={styles.row}>
        <Text style={styles.emoji}>{emojiFor(item.iconKey)}</Text>
        {hasPrice && <DeltaPill deltaPct={item.deltaPct} size="sm" />}
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {name}
      </Text>
      <View style={styles.priceRow}>
        <Text style={styles.price}>{priceText}</Text>
        {unit === 'qtl' && hasPrice && <Text style={styles.unit}>{unitSuffix}</Text>}
      </View>
      {hasPrice ? (
        <Sparkline data={item.spark} width={120} height={28} />
      ) : (
        <Text style={styles.noPrice}>{lang === 'mr' ? 'आज भाव नाही' : 'No price today'}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 170,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginRight: spacing.md,
    ...shadow.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  emoji: { fontSize: 28 },
  name: {
    fontSize: font.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    minHeight: 38,
  },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: spacing.sm },
  price: { fontSize: font.xl, fontWeight: '700', color: colors.text },
  unit: { fontSize: font.sm, color: colors.textMuted, marginLeft: 2 },
  noPrice: { fontSize: font.sm, color: colors.textMuted, height: 28, textAlignVertical: 'center' },
});
