import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, font, radius, shadow, spacing } from '../theme';
import { useSettings, useDict } from '../store/settingsStore';
import { useWatchlist } from '../store/watchlistStore';
import { getToday, getTopMovers } from '../api/client';
import type { CommodityWithPrice } from '../types';
import { WatchlistCard } from '../components/WatchlistCard';
import { SectionHeader } from '../components/SectionHeader';
import { CommodityRow } from '../components/CommodityRow';
import { StaleBanner } from '../components/StaleBanner';
import { WeatherCard } from '../components/WeatherCard';
import { TipOfDay } from '../components/TipOfDay';
import { NewsTeaser } from '../components/NewsTeaser';
import { QuickTools } from '../components/QuickTools';
import { FarmActionsStrip } from '../components/FarmActionsStrip';
import { RainRadarStrip } from '../components/RainRadarStrip';
import { DaysToHarvestCard } from '../components/DaysToHarvestCard';
import { VillagePickerModal } from '../components/VillagePickerModal';
import { FarmerHero } from '../components/illustrations/FarmerHero';
import { Sprout } from '../components/illustrations/Sprout';
import { formatDate } from '../utils/format';
import { TODAY_ISO } from '../data/mockData';
import { IS_REAL } from '../api/config';
import { useLocation, activeVillage } from '../store/locationStore';

type Props = {
  onOpenDetail: (slug: string) => void;
  onAddCrops: () => void;
  onOpenNews: () => void;
  onOpenSchemes: () => void;
  onOpenHelpline: () => void;
  onOpenVideos: () => void;
  onOpenCropDoctor: () => void;
  onOpenMarkets: () => void;
  onOpenAskAdvisor: () => void;
  onOpenFarmDiary: () => void;
};

function greetingKey(): 'homeGreetingMorning' | 'homeGreetingAfternoon' | 'homeGreetingEvening' {
  const h = new Date().getHours();
  if (h < 12) return 'homeGreetingMorning';
  if (h < 17) return 'homeGreetingAfternoon';
  return 'homeGreetingEvening';
}

export function HomeScreen(p: Props) {
  const t = useDict();
  const lang = useSettings((s) => s.language);
  const name = useSettings((s) => s.name);
  const watchIds = useWatchlist((s) => s.ids);
  const villageId = useLocation((s) => s.villageId);
  const village = activeVillage({ villageId });
  const [villagePickerOpen, setVillagePickerOpen] = useState(false);

  const [watched, setWatched] = useState<CommodityWithPrice[] | null>(null);
  const [gainers, setGainers] = useState<CommodityWithPrice[]>([]);
  const [losers, setLosers] = useState<CommodityWithPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<{ date: string; stale: boolean }>({ date: TODAY_ISO, stale: false });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      watchIds.length > 0
        ? getToday({ ids: watchIds })
        : getToday({ ids: [] }).catch(() => ({ items: [], date: TODAY_ISO, stale: false })),
      getTopMovers('gainers'),
      getTopMovers('losers'),
    ]).then(([w, g, l]) => {
      if (cancelled) return;
      const order = new Map(watchIds.map((id, i) => [id, i]));
      const sortedW = [...w.items].sort(
        (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
      );
      setWatched(sortedW);
      setGainers(g);
      setLosers(l);
      setMeta({ date: w.date ?? TODAY_ISO, stale: !!w.stale });
      setLoading(false);
    }).catch(() => {
      if (cancelled) return;
      setWatched([]);
      setGainers([]);
      setLosers([]);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [watchIds.join(',')]);

  const greet = t[greetingKey()];
  const displayName = name.trim() ? `, ${name}` : '';
  const marketOpen = new Date().getHours() < 20;

  const onShareApp = () => {
    Share.share({
      message: t.referMessage('https://bajarbhav.app'),
    });
  };

  return (
    <SafeAreaView style={styles.wrap} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greet}>{greet}{displayName}</Text>
            <Text style={styles.date}>{formatDate(meta.date, lang)}</Text>
            <Pressable
              onPress={() => setVillagePickerOpen(true)}
              style={styles.villagePill}
            >
              <Text style={styles.villagePillText}>
                📍  {village.name[lang]}
              </Text>
            </Pressable>
            <View style={[styles.badge, marketOpen ? styles.badgeOpen : styles.badgeClosed]}>
              <View style={[styles.dot, marketOpen ? styles.dotOpen : styles.dotClosed]} />
              <Text style={styles.badgeText}>
                {marketOpen ? t.homeMarketOpen : t.homeMarketClosed}
              </Text>
            </View>
          </View>
          <FarmerHero width={140} height={116} />
        </View>

        <Pressable style={styles.askBanner} onPress={p.onOpenAskAdvisor}>
          <Text style={styles.askEmoji}>🤖</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.askTitle}>{t.askAdvisorHomeTitle}</Text>
            <Text style={styles.askBody}>{t.askAdvisorHomeSub}</Text>
          </View>
          <Text style={styles.chev}>›</Text>
        </Pressable>

        {!IS_REAL && (
          <View style={styles.mockBanner}>
            <Text style={styles.mockText}>📋 {t.profileMockBanner}</Text>
          </View>
        )}

        {meta.stale && <StaleBanner date={meta.date} />}

        <FarmActionsStrip />

        <WeatherCard />

        <RainRadarStrip />

        {watched && watched.length > 0 && (
          <DaysToHarvestCard items={watched} onOpenDetail={p.onOpenDetail} />
        )}

        {/* Watchlist strip */}
        {watchIds.length === 0 ? (
          <View style={styles.empty}>
            <Sprout width={100} height={100} />
            <Text style={styles.emptyTitle}>{t.watchlistEmptyTitle}</Text>
            <Text style={styles.emptyBody}>{t.watchlistEmptyBody}</Text>
            <Pressable style={styles.emptyCta} onPress={p.onAddCrops}>
              <Text style={styles.emptyCtaText}>{t.watchlistAddMore}</Text>
            </Pressable>
          </View>
        ) : loading || !watched ? (
          <View style={styles.loader}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <>
            <SectionHeader title={t.homeYourCrops} />
            <FlatList
              data={watched}
              keyExtractor={(x) => String(x.id)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.watchRow}
              renderItem={({ item }) => (
                <WatchlistCard item={item} onPress={() => p.onOpenDetail(item.slug)} />
              )}
              ListFooterComponent={
                <Pressable style={styles.addTile} onPress={p.onAddCrops}>
                  <Text style={styles.addPlus}>+</Text>
                  <Text style={styles.addText}>{t.watchlistAddMore}</Text>
                </Pressable>
              }
            />
          </>
        )}

        <TipOfDay />

        {/* Quick tools */}
        <SectionHeader title={t.homeQuickTools} />
        <QuickTools
          items={[
            { key: 'schemes', onPress: p.onOpenSchemes },
            { key: 'helpline', onPress: p.onOpenHelpline },
            { key: 'calculator', onPress: p.onOpenMarkets },
            { key: 'calendar', onPress: p.onOpenMarkets },
            { key: 'videos', onPress: p.onOpenVideos },
            { key: 'cropDoctor', onPress: p.onOpenCropDoctor },
          ]}
        />

        {/* Gainers / losers */}
        {!loading && gainers.length > 0 && (
          <>
            <SectionHeader title={t.topGainers} />
            <View style={styles.card}>
              {gainers.slice(0, 5).map((item) => (
                <CommodityRow key={item.id} item={item} onPress={() => p.onOpenDetail(item.slug)} />
              ))}
            </View>
          </>
        )}

        {!loading && losers.length > 0 && (
          <>
            <SectionHeader title={t.topLosers} />
            <View style={styles.card}>
              {losers.slice(0, 5).map((item) => (
                <CommodityRow key={item.id} item={item} onPress={() => p.onOpenDetail(item.slug)} />
              ))}
            </View>
          </>
        )}

        {/* News */}
        <NewsTeaser onOpenAll={p.onOpenNews} />

        {/* Refer */}
        <Pressable style={styles.refer} onPress={onShareApp}>
          <Text style={styles.referEmoji}>📣</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.referTitle}>{t.referCta}</Text>
            <Text style={styles.referBody}>{t.heroBrag}</Text>
          </View>
          <Text style={styles.chev}>›</Text>
        </Pressable>

        <Text style={styles.source}>{t.detailSource}</Text>
      </ScrollView>
      <VillagePickerModal
        visible={villagePickerOpen}
        onClose={() => setVillagePickerOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: spacing.xxl },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  greet: { fontSize: font.xxl, fontWeight: '800', color: colors.text },
  date: { fontSize: font.sm, color: colors.textMuted, marginTop: 2 },
  villagePill: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  villagePillText: { fontSize: font.xs, fontWeight: '700', color: colors.primaryDark },
  askBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: '#EEF2FF',
    borderRadius: radius.lg,
    gap: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.indigo,
  },
  askEmoji: { fontSize: 28 },
  askTitle: { fontSize: font.md, fontWeight: '800', color: colors.indigo },
  askBody: { fontSize: font.sm, color: colors.text, marginTop: 2, lineHeight: 18 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    gap: 6,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  badgeOpen: { backgroundColor: colors.upBg },
  badgeClosed: { backgroundColor: colors.flatBg },
  badgeText: { fontSize: font.xs, fontWeight: '700', color: colors.text },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotOpen: { backgroundColor: colors.success },
  dotClosed: { backgroundColor: colors.flat },
  mockBanner: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  mockText: { fontSize: font.xs, color: '#92400E' },
  loader: { padding: spacing.xl, alignItems: 'center' },
  empty: {
    margin: spacing.lg,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    alignItems: 'center',
    ...shadow.card,
  },
  emptyTitle: { fontSize: font.lg, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
  emptyBody: {
    fontSize: font.sm,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyCta: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    ...shadow.pop,
  },
  emptyCtaText: { color: '#fff', fontWeight: '700', fontSize: font.md },
  watchRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  addTile: {
    width: 140,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  addPlus: { fontSize: 40, color: colors.primary, fontWeight: '300' },
  addText: { fontSize: font.sm, color: colors.textMuted, textAlign: 'center' },
  card: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.card,
  },
  refer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.primarySoft,
  },
  referEmoji: { fontSize: 28 },
  referTitle: { fontSize: font.md, fontWeight: '800', color: colors.primaryDark },
  referBody: { fontSize: font.sm, color: colors.text, marginTop: 2, lineHeight: 18 },
  chev: { fontSize: 28, color: colors.primary, fontWeight: '300' },
  source: {
    textAlign: 'center',
    fontSize: font.xs,
    color: colors.textSubtle,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
});
