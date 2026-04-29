import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, spacing } from '../theme';
import { useSettings, useDict } from '../store/settingsStore';
import { useWatchlist } from '../store/watchlistStore';
import { COMMODITIES } from '../data/mockData';
import { emojiFor } from '../utils/icons';
import { CategoryTabs } from '../components/CategoryTabs';
import type { Category } from '../types';

type Props = { onDone: () => void };

export function OnboardingCropsScreen({ onDone }: Props) {
  const t = useDict();
  const lang = useSettings((s) => s.language);
  const setOnboardingDone = useSettings((s) => s.setOnboardingDone);
  const ids = useWatchlist((s) => s.ids);
  const toggle = useWatchlist((s) => s.toggle);
  const insets = useSafeAreaInsets();
  // Same Android-gesture-nav fix as the tab bar — without this, the footer's
  // CTA sits under the system gesture strip and taps land in the OS, not the
  // app, so "Skip"/"Continue" silently fail.
  const footerInset = Platform.OS === 'android'
    ? Math.max(insets.bottom, 12)
    : insets.bottom;

  const [cat, setCat] = useState<Category>('veg');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return COMMODITIES.filter((c) => {
      if (c.category !== cat) return false;
      if (!q) return true;
      return (
        c.name.mr.toLowerCase().includes(q) ||
        c.name.en.toLowerCase().includes(q) ||
        c.slug.includes(q)
      );
    });
  }, [cat, query]);

  const selectedCount = ids.length;

  const finish = () => {
    setOnboardingDone(true);
    onDone();
  };

  return (
    <SafeAreaView style={styles.wrap} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.onboardingCropsTitle}</Text>
        <Text style={styles.sub}>{t.onboardingCropsSubtitle}</Text>
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t.search + '…'}
        placeholderTextColor={colors.textSubtle}
        style={styles.search}
      />

      <CategoryTabs value={cat} onChange={setCat} />

      <View style={styles.listWrap}>
        <FlatList
          data={filtered}
          keyExtractor={(x) => String(x.id)}
          numColumns={3}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ gap: spacing.sm }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const picked = ids.includes(item.id);
            return (
              <Pressable
                onPress={() => toggle(item.id)}
                style={[styles.tile, picked && styles.tileActive]}
              >
                <Text style={styles.tileEmoji}>{emojiFor(item.iconKey)}</Text>
                <Text
                  style={[styles.tileName, picked && styles.tileNameActive]}
                  numberOfLines={2}
                >
                  {item.name[lang]}
                </Text>
                {picked && <Text style={styles.check}>✓</Text>}
              </Pressable>
            );
          }}
        />
      </View>

      <View
        style={[
          styles.footer,
          { paddingBottom: footerInset + spacing.md },
        ]}
      >
        <Pressable onPress={finish} hitSlop={8}>
          <Text style={styles.skip}>{t.skip}</Text>
        </Pressable>
        <Pressable
          onPress={finish}
          // Always tappable — even with 0 selected we let them skip-via-CTA
          // rather than silently failing. The label still shows "(0)" so they
          // know what they're doing.
          style={styles.cta}
          hitSlop={8}
        >
          <Text style={styles.ctaText}>{t.onboardingCropsContinueN(selectedCount)}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  listWrap: { flex: 1, zIndex: 0 },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  title: { fontSize: font.xxl, fontWeight: '800', color: colors.text },
  sub: { fontSize: font.sm, color: colors.textMuted, marginTop: 4 },
  search: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: font.md,
    color: colors.text,
  },
  grid: { paddingHorizontal: spacing.lg, paddingBottom: 120, gap: spacing.sm },
  tile: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  tileActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary, borderWidth: 2 },
  tileEmoji: { fontSize: 36, marginBottom: 4 },
  tileName: { fontSize: font.xs, color: colors.text, textAlign: 'center', fontWeight: '600' },
  tileNameActive: { color: colors.primaryDark },
  check: {
    position: 'absolute',
    top: 6,
    right: 8,
    color: colors.primary,
    fontWeight: '800',
    fontSize: font.md,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    elevation: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    // paddingBottom is set dynamically based on safe-area insets so the
    // CTA never sits under Android's gesture nav strip.
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  skip: { color: colors.textMuted, fontSize: font.md, fontWeight: '600', padding: spacing.sm },
  cta: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontSize: font.md, fontWeight: '700' },
});
