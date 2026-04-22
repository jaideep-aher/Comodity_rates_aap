import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Listing } from '../types';
import { colors, font, radius, shadow, spacing } from '../theme';
import { useSettings } from '../store/settingsStore';
import { emojiFor } from '../utils/icons';
import { formatRupees } from '../utils/format';

type Props = { item: Listing; onPress: () => void };

export function ListingCard({ item, onPress }: Props) {
  const lang = useSettings((s) => s.language);
  const name = item.commodity.name[lang];
  const location =
    item.location.village +
    (item.location.district ? ', ' + item.location.district : '');
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <Text style={styles.icon}>{emojiFor(item.commodity.iconKey)}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.loc} numberOfLines={1}>
            {location}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.price}>{formatRupees(item.askPrice)}</Text>
          <Text style={styles.qty}>{item.quantityQtl}q</Text>
        </View>
      </View>
      <View style={styles.badges}>
        <Badge label={gradeLabel(item.qualityGrade)} />
        {item.isNegotiable ? <Badge label="Negotiable" tint="accent" /> : null}
      </View>
    </Pressable>
  );
}

function Badge({ label, tint }: { label: string; tint?: 'accent' }) {
  return (
    <View style={[styles.badge, tint === 'accent' && styles.badgeAccent]}>
      <Text style={[styles.badgeText, tint === 'accent' && styles.badgeTextAccent]}>{label}</Text>
    </View>
  );
}

function gradeLabel(g: string) {
  if (g === 'premium') return 'Premium';
  if (g === 'value') return 'Value';
  return 'Standard';
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { fontSize: 32, width: 40 },
  name: { fontSize: font.md, fontWeight: '700', color: colors.text },
  loc: { fontSize: font.sm, color: colors.textMuted, marginTop: 2 },
  price: { fontSize: font.lg, fontWeight: '800', color: colors.primaryDark },
  qty: { fontSize: font.xs, color: colors.textMuted },
  badges: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm },
  badge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  badgeAccent: { backgroundColor: '#FEF3C7' },
  badgeText: { fontSize: font.xs, color: colors.primaryDark, fontWeight: '600' },
  badgeTextAccent: { color: '#92400E' },
});
