import React from 'react';
import { FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { G, Path } from 'react-native-svg';
import { colors, font, radius, shadow, spacing } from '../theme';
import { VIDEOS, videoTitle } from '../data/videos';
import { useDict, useSettings, useNumeralLang } from '../store/settingsStore';
import { localiseNumber } from '../utils/format';

const THUMB_COLOR: Record<string, { bg: string; fg: string }> = {
  pest: { bg: '#DCFCE7', fg: '#166534' },
  store: { bg: '#FEF3C7', fg: '#92400E' },
  govt: { bg: '#E0F2FE', fg: '#075985' },
  water: { bg: '#CFFAFE', fg: '#155E75' },
  organic: { bg: '#E6F4EE', fg: '#0B6E4F' },
  market: { bg: '#FCE7F3', fg: '#9D174D' },
};

type Props = { onBack: () => void };

export function VideosScreen({ onBack }: Props) {
  const t = useDict();
  const lang = useSettings((s) => s.language);
  const nLang = useNumeralLang();

  return (
    <SafeAreaView style={styles.wrap} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={16}>
          <Text style={styles.back}>‹ {t.back}</Text>
        </Pressable>
        <Text style={styles.title}>{t.videosTitle}</Text>
      </View>
      <FlatList
        data={VIDEOS}
        keyExtractor={(v) => v.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => {
          const thumb = THUMB_COLOR[item.thumb] ?? THUMB_COLOR.market;
          return (
            <Pressable style={styles.card} onPress={() => Linking.openURL(item.url)}>
              <View style={[styles.thumb, { backgroundColor: thumb.bg }]}>
                <Svg width={36} height={36} viewBox="0 0 24 24">
                  <G fill={thumb.fg}>
                    <Path d="M5 4 L20 12 L5 20 Z" />
                  </G>
                </Svg>
                <View style={styles.durationBadge}>
                  <Text style={styles.duration}>
                    {localiseNumber(item.durationMin, nLang)} {lang === 'mr' ? 'मि' : 'min'}
                  </Text>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.videoTitle} numberOfLines={2}>{videoTitle(item, lang)}</Text>
                <Text style={styles.channel}>{item.channel}</Text>
                <Text style={styles.watch}>{t.videosWatch} ›</Text>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm, gap: 4 },
  back: { color: colors.primary, fontSize: font.md, fontWeight: '700' },
  title: { fontSize: font.xxl, fontWeight: '800', color: colors.text },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: radius.lg,
    gap: spacing.md,
    ...shadow.soft,
  },
  thumb: {
    width: 100,
    height: 72,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  durationBadge: {
    position: 'absolute', bottom: 4, right: 4,
    backgroundColor: 'rgba(15,23,42,0.75)',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  duration: { color: '#fff', fontSize: font.xs, fontWeight: '600' },
  videoTitle: { fontSize: font.md, fontWeight: '700', color: colors.text },
  channel: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },
  watch: { fontSize: font.sm, color: colors.primary, fontWeight: '700', marginTop: 4 },
});
