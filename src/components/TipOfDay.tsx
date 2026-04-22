import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { colors, font, radius, spacing } from '../theme';
import { useDict } from '../store/settingsStore';

export function TipOfDay() {
  const t = useDict();
  const tips = [t.tipOfDay1, t.tipOfDay2, t.tipOfDay3, t.tipOfDay4, t.tipOfDay5];
  const idx = dayOfYear() % tips.length;
  return (
    <View style={styles.wrap}>
      <View style={styles.bulb}>
        <Svg width={32} height={32} viewBox="0 0 24 24">
          <G fill="#F59E0B">
            <Path d="M12 3 Q6 3 6 9 Q6 12 8 14 L8 17 L16 17 L16 14 Q18 12 18 9 Q18 3 12 3 Z" />
            <Path d="M9 19 L15 19 L15 20 L9 20 Z" fill="#B45309" />
          </G>
          <G stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round">
            <Path d="M12 1 L12 3" />
            <Path d="M3 10 L5 10" />
            <Path d="M19 10 L21 10" />
            <Path d="M5 4 L6.5 5.5" />
            <Path d="M17.5 5.5 L19 4" />
          </G>
          <Circle cx="12" cy="9" r="2.5" fill="#FEF3C7" />
        </Svg>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{t.homeTipOfDay}</Text>
        <Text style={styles.body}>{tips[idx]}</Text>
      </View>
    </View>
  );
}

function dayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  bulb: {
    width: 40, height: 40, borderRadius: radius.pill, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  label: { fontSize: font.xs, color: '#92400E', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  body: { fontSize: font.md, color: colors.text, fontWeight: '600', marginTop: 2, lineHeight: 22 },
});
