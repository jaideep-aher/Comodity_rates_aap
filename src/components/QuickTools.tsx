import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { colors, font, radius, shadow, spacing } from '../theme';
import { useDict } from '../store/settingsStore';

export type ToolKey = 'schemes' | 'helpline' | 'calculator' | 'calendar' | 'videos' | 'cropDoctor';

type Item = { key: ToolKey; onPress: () => void };
type Props = { items: Item[] };

const THEME: Record<ToolKey, { color: string; bg: string; labelKey: string }> = {
  schemes: { color: colors.primary, bg: colors.primarySoft, labelKey: 'quickToolSchemes' },
  helpline: { color: colors.saffron, bg: colors.saffronSoft, labelKey: 'quickToolHelpline' },
  calculator: { color: colors.indigo, bg: colors.indigoSoft, labelKey: 'quickToolCalculator' },
  calendar: { color: colors.sky, bg: colors.skySoft, labelKey: 'quickToolCalendar' },
  videos: { color: colors.berry, bg: colors.berrySoft, labelKey: 'quickToolVideos' },
  cropDoctor: { color: colors.success, bg: '#DCFCE7', labelKey: 'quickToolCropDoctor' },
};

export function QuickTools({ items }: Props) {
  const t = useDict();
  return (
    <View style={styles.grid}>
      {items.map((i) => {
        const theme = THEME[i.key];
        const label = (t as unknown as Record<string, string>)[theme.labelKey];
        return (
          <Pressable
            key={i.key}
            onPress={i.onPress}
            style={({ pressed }) => [styles.tile, pressed && { opacity: 0.85 }]}
          >
            <View style={[styles.iconWrap, { backgroundColor: theme.bg }]}>
              <ToolGlyph kind={i.key} color={theme.color} />
            </View>
            <Text style={styles.label} numberOfLines={2}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ToolGlyph({ kind, color }: { kind: ToolKey; color: string }) {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24">
      {kind === 'schemes' && (
        <G stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <Rect x="4" y="5" width="16" height="14" rx="2" />
          <Path d="M4 9 L20 9" />
          <Path d="M8 13 L16 13 M8 16 L14 16" />
          <Circle cx="17" cy="16" r="2" fill={color} />
        </G>
      )}
      {kind === 'helpline' && (
        <G fill={color}>
          <Path d="M4 6 Q4 4 6 4 L8 4 L10 8 L7 10 Q9 14 14 16 L16 13 L20 15 L20 18 Q20 20 18 20 Q10 20 4 14 Q4 10 4 6 Z" />
        </G>
      )}
      {kind === 'calculator' && (
        <G stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <Rect x="5" y="3" width="14" height="18" rx="2" />
          <Rect x="7" y="5" width="10" height="4" rx="1" fill={color} fillOpacity="0.2" />
          <Circle cx="9" cy="13" r="1" fill={color} />
          <Circle cx="12" cy="13" r="1" fill={color} />
          <Circle cx="15" cy="13" r="1" fill={color} />
          <Circle cx="9" cy="17" r="1" fill={color} />
          <Circle cx="12" cy="17" r="1" fill={color} />
          <Circle cx="15" cy="17" r="1" fill={color} />
        </G>
      )}
      {kind === 'calendar' && (
        <G stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <Rect x="4" y="6" width="16" height="14" rx="2" />
          <Path d="M4 10 L20 10" />
          <Path d="M8 4 L8 8 M16 4 L16 8" />
          <Rect x="8" y="13" width="3" height="3" fill={color} />
        </G>
      )}
      {kind === 'videos' && (
        <G stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <Rect x="3" y="6" width="14" height="12" rx="2" />
          <Path d="M17 10 L21 7 L21 17 L17 14 Z" fill={color} fillOpacity="0.2" />
          <Path d="M9 10 L13 12 L9 14 Z" fill={color} />
        </G>
      )}
      {kind === 'cropDoctor' && (
        <G stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M12 4 Q7 4 7 10 Q7 16 12 20 Q17 16 17 10 Q17 4 12 4 Z" fill={color} fillOpacity="0.2" />
          <Path d="M12 8 L12 16 M8 12 L16 12" />
        </G>
      )}
    </Svg>
  );
}

const styles = StyleSheet.create({
  grid: {
    marginHorizontal: spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  tile: {
    width: '31.5%',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.lg,
    ...shadow.soft,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: font.sm,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
});
