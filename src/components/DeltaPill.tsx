import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, spacing } from '../theme';
import { formatDelta } from '../utils/format';

type Props = {
  deltaPct: number;
  size?: 'sm' | 'md';
};

export function DeltaPill({ deltaPct, size = 'md' }: Props) {
  const isUp = deltaPct > 0.1;
  const isDown = deltaPct < -0.1;
  const bg = isUp ? colors.upBg : isDown ? colors.downBg : colors.flatBg;
  const fg = isUp ? colors.up : isDown ? colors.down : colors.flat;
  const arrow = isUp ? '▲' : isDown ? '▼' : '–';
  const fontSize = size === 'sm' ? font.xs : font.sm;
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg, fontSize }]}>
        {arrow} {formatDelta(Math.abs(deltaPct))}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
});
