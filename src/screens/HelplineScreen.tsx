import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { G, Path } from 'react-native-svg';
import { colors, font, radius, shadow, spacing } from '../theme';
import { useDict } from '../store/settingsStore';

type Entry = {
  key: string;
  title: string;
  subtitle: string;
  phone: string;
  color: string;
};

type Props = { onBack: () => void };

export function HelplineScreen({ onBack }: Props) {
  const t = useDict();
  const entries: Entry[] = [
    { key: 'kcc', title: t.helplineKisan, subtitle: t.helplineKisanSub, phone: '18001801551', color: colors.primary },
    { key: 'pmk', title: t.helplinePmKisan, subtitle: t.helplinePmKisanSub, phone: '155261', color: colors.saffron },
    { key: 'imd', title: t.helplineWeather, subtitle: t.helplineWeatherSub, phone: '18001801717', color: colors.sky },
    { key: 'agmark', title: t.helplineAgmarknet, subtitle: t.helplineAgmarknetSub, phone: '18001801551', color: colors.berry },
  ];

  return (
    <SafeAreaView style={styles.wrap} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={16}>
          <Text style={styles.back}>‹ {t.back}</Text>
        </Pressable>
        <Text style={styles.title}>{t.helplineTitle}</Text>
        <Text style={styles.subtitle}>{t.helplineTagline}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm }}>
        {entries.map((e) => (
          <View key={e.key} style={styles.card}>
            <View style={[styles.icon, { backgroundColor: e.color + '22' }]}>
              <PhoneGlyph color={e.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{e.title}</Text>
              <Text style={styles.cardSub}>{e.subtitle}</Text>
              <Text style={styles.phone}>{e.phone.replace(/(.{4})/g, '$1 ').trim()}</Text>
            </View>
            <Pressable
              style={[styles.callBtn, { backgroundColor: e.color }]}
              onPress={() => Linking.openURL(`tel:${e.phone}`)}
            >
              <Text style={styles.callText}>{t.helplineCall}</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function PhoneGlyph({ color }: { color: string }) {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24">
      <G fill={color}>
        <Path d="M4 6 Q4 4 6 4 L8 4 L10 8 L7 10 Q9 14 14 16 L16 13 L20 15 L20 18 Q20 20 18 20 Q10 20 4 14 Q4 10 4 6 Z" />
      </G>
    </Svg>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm, gap: 4 },
  back: { color: colors.primary, fontSize: font.md, fontWeight: '700' },
  title: { fontSize: font.xxl, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: font.sm, color: colors.textMuted },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.md,
    ...shadow.soft,
  },
  icon: { width: 48, height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: font.md, fontWeight: '700', color: colors.text },
  cardSub: { fontSize: font.sm, color: colors.textMuted, marginTop: 2 },
  phone: { fontSize: font.sm, color: colors.primary, marginTop: 6, fontVariant: ['tabular-nums'] },
  callBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  callText: { color: '#fff', fontWeight: '700', fontSize: font.sm },
});
