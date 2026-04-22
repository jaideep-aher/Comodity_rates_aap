import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, font, radius, spacing } from '../theme';
import { CategoryTabs } from '../components/CategoryTabs';
import { CommodityRow } from '../components/CommodityRow';
import { StaleBanner } from '../components/StaleBanner';
import type { Category, CommodityWithPrice } from '../types';
import { getToday } from '../api/client';
import { useSettings, useDict } from '../store/settingsStore';

type SortKey = 'name' | 'price' | 'delta' | 'arrival';

type Props = { onOpenDetail: (slug: string) => void };

export function BrowseScreen({ onOpenDetail }: Props) {
  const t = useDict();
  const lang = useSettings((s) => s.language);
  const [cat, setCat] = useState<Category>('veg');
  const [items, setItems] = useState<CommodityWithPrice[] | null>(null);
  const [meta, setMeta] = useState<{ date: string; stale: boolean } | null>(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('arrival');

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    getToday({ category: cat }).then((res) => {
      if (cancelled) return;
      setItems(res.items);
      setMeta({ date: res.date, stale: !!res.stale });
    }).catch(() => {
      if (!cancelled) setItems([]);
    });
    return () => {
      cancelled = true;
    };
  }, [cat]);

  const filtered = useMemo(() => {
    if (!items) return null;
    const q = query.trim().toLowerCase();
    let out = items;
    if (q) {
      out = out.filter(
        (i) =>
          i.name.mr.toLowerCase().includes(q) ||
          i.name.en.toLowerCase().includes(q) ||
          i.slug.includes(q),
      );
    }
    const sorted = [...out].sort((a, b) => {
      if (sort === 'name') return a.name[lang].localeCompare(b.name[lang]);
      if (sort === 'price') return b.today.avg - a.today.avg;
      if (sort === 'delta') return b.deltaPct - a.deltaPct;
      return b.today.arrival - a.today.arrival;
    });
    return sorted;
  }, [items, query, sort, lang]);

  const sortChips: { key: SortKey; label: string }[] = [
    { key: 'arrival', label: lang === 'mr' ? 'आवक' : 'Arrival' },
    { key: 'price', label: lang === 'mr' ? 'भाव' : 'Price' },
    { key: 'delta', label: lang === 'mr' ? 'बदल' : 'Change' },
    { key: 'name', label: lang === 'mr' ? 'नाव' : 'Name' },
  ];

  return (
    <SafeAreaView style={styles.wrap} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.tabMarkets}</Text>
      </View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t.search + '…'}
        placeholderTextColor={colors.textSubtle}
        style={styles.search}
      />
      <CategoryTabs value={cat} onChange={setCat} />

      {meta?.stale && <StaleBanner date={meta.date} />}

      <View style={styles.sortBar}>
        {sortChips.map((c) => {
          const active = sort === c.key;
          return (
            <Text
              key={c.key}
              onPress={() => setSort(c.key)}
              style={[styles.sortChip, active && styles.sortChipActive]}
            >
              {c.label}
            </Text>
          );
        })}
      </View>

      {!filtered ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(x) => String(x.id)}
          renderItem={({ item }) => (
            <CommodityRow item={item} onPress={() => onOpenDetail(item.slug)} />
          )}
          ListFooterComponent={
            <Text style={styles.source}>{t.detailSource}</Text>
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              {lang === 'mr' ? 'काही सापडले नाही' : 'No matches'}
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  title: { fontSize: font.xxl, fontWeight: '800', color: colors.text },
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
  sortBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  sortChip: {
    fontSize: font.xs,
    color: colors.textMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  sortChipActive: {
    color: '#fff',
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  loader: { padding: spacing.xl, alignItems: 'center' },
  empty: { textAlign: 'center', padding: spacing.xl, color: colors.textMuted },
  source: {
    textAlign: 'center',
    fontSize: font.xs,
    color: colors.textSubtle,
    padding: spacing.lg,
  },
});
