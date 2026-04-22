import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, shadow, spacing } from '../theme';
import { NEWS, newsSummary, newsTitle } from '../data/news';
import { useDict, useSettings } from '../store/settingsStore';
import { SectionHeader } from './SectionHeader';
import { formatRelative } from '../utils/format';

type Props = { onOpenAll: () => void };

const TAG_COLOR: Record<string, { bg: string; fg: string; label: { mr: string; en: string } }> = {
  market: { bg: '#DCFCE7', fg: '#166534', label: { mr: 'बाजार', en: 'Market' } },
  weather: { bg: '#E0F2FE', fg: '#075985', label: { mr: 'हवामान', en: 'Weather' } },
  scheme: { bg: '#FEF3C7', fg: '#92400E', label: { mr: 'योजना', en: 'Scheme' } },
  crop: { bg: '#FCE7F3', fg: '#9D174D', label: { mr: 'पीक', en: 'Crop' } },
};

export function NewsTeaser({ onOpenAll }: Props) {
  const t = useDict();
  const lang = useSettings((s) => s.language);
  const items = NEWS.slice(0, 3);
  return (
    <>
      <SectionHeader title={t.learnNews} actionLabel={t.viewAll} onAction={onOpenAll} />
      <View style={styles.list}>
        {items.map((n) => {
          const tag = TAG_COLOR[n.tag];
          return (
            <Pressable
              key={n.id}
              style={styles.card}
              onPress={() => n.url && Linking.openURL(n.url)}
            >
              <View style={styles.headerRow}>
                <View style={[styles.tag, { backgroundColor: tag.bg }]}>
                  <Text style={[styles.tagText, { color: tag.fg }]}>{tag.label[lang]}</Text>
                </View>
                <Text style={styles.time}>{formatRelative(n.date, lang)}</Text>
              </View>
              <Text style={styles.title} numberOfLines={2}>{newsTitle(n, lang)}</Text>
              <Text style={styles.summary} numberOfLines={2}>{newsSummary(n, lang)}</Text>
              <Text style={styles.source}>{n.source}</Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  list: { marginHorizontal: spacing.lg, gap: spacing.sm },
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
  title: { fontSize: font.md, fontWeight: '700', color: colors.text, marginBottom: 4 },
  summary: { fontSize: font.sm, color: colors.textMuted, lineHeight: 19 },
  source: { fontSize: font.xs, color: colors.primary, marginTop: 6, fontWeight: '700' },
});
