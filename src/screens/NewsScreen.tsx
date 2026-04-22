import React from 'react';
import { FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, font, radius, shadow, spacing } from '../theme';
import { NEWS, newsSummary, newsTitle } from '../data/news';
import { useDict, useSettings } from '../store/settingsStore';
import { formatRelative } from '../utils/format';

const TAG_COLOR: Record<string, { bg: string; fg: string; label: { mr: string; en: string } }> = {
  market: { bg: '#DCFCE7', fg: '#166534', label: { mr: 'बाजार', en: 'Market' } },
  weather: { bg: '#E0F2FE', fg: '#075985', label: { mr: 'हवामान', en: 'Weather' } },
  scheme: { bg: '#FEF3C7', fg: '#92400E', label: { mr: 'योजना', en: 'Scheme' } },
  crop: { bg: '#FCE7F3', fg: '#9D174D', label: { mr: 'पीक', en: 'Crop' } },
};

type Props = { onBack: () => void };

export function NewsScreen({ onBack }: Props) {
  const t = useDict();
  const lang = useSettings((s) => s.language);

  return (
    <SafeAreaView style={styles.wrap} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={16}>
          <Text style={styles.back}>‹ {t.back}</Text>
        </Pressable>
        <Text style={styles.title}>{t.newsTitle}</Text>
      </View>
      <FlatList
        data={NEWS}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
        ListEmptyComponent={<Text style={styles.empty}>{t.newsEmpty}</Text>}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => {
          const tag = TAG_COLOR[item.tag];
          return (
            <Pressable
              style={styles.card}
              onPress={() => item.url && Linking.openURL(item.url)}
            >
              <View style={styles.headerRow}>
                <View style={[styles.tag, { backgroundColor: tag.bg }]}>
                  <Text style={[styles.tagText, { color: tag.fg }]}>{tag.label[lang]}</Text>
                </View>
                <Text style={styles.time}>{formatRelative(item.date, lang)}</Text>
              </View>
              <Text style={styles.newsTitle}>{newsTitle(item, lang)}</Text>
              <Text style={styles.summary}>{newsSummary(item, lang)}</Text>
              <Text style={styles.source}>{item.source}</Text>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: 4,
  },
  back: { color: colors.primary, fontSize: font.md, fontWeight: '700' },
  title: { fontSize: font.xxl, fontWeight: '800', color: colors.text },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.soft,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  tag: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
  tagText: { fontSize: font.xs, fontWeight: '700' },
  time: { fontSize: font.xs, color: colors.textSubtle },
  newsTitle: { fontSize: font.md, fontWeight: '700', color: colors.text, marginBottom: 4 },
  summary: { fontSize: font.sm, color: colors.textMuted, lineHeight: 20 },
  source: { fontSize: font.xs, color: colors.primary, marginTop: 6, fontWeight: '700' },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xxl },
});
