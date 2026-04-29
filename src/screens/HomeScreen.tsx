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
import { RainRadarStrip } from '../components/RainRadarStrip';
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
  onOpenMarkets: () => void;
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
  const [arrivals, setArrivals] = useState<CommodityWithPrice[]>([]);
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
      getTopMovers('arrivals'),
    ]).then(([w, g, l, a]) => {
      if (cancelled) return;
      const order = new Map(watchIds.map((id, i) => [id, i]));
      const sortedW = [...w.items].sort(
        (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
      );
      setWatched(sortedW);
      setGainers(g);
      setLosers(l);
      setArrivals(a);
      setMeta({ date: w.date ?? TODAY_ISO, stale: !!w.stale });
      setLoading(false);
    }).catch(() => {
      if (cancelled) return;
      setWatched([]);
      setGainers([]);
      setLosers([]);
      setArrivals([]);
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

  const onShareRates = () => {
    if (!watched || watched.length === 0) return;
    const dateStr = formatDate(meta.date, lang);
    const unit = useSettings.getState().unit;
    const lines = watched
      .filter((w) => w.today.avg > 0)
      .map((w) => {
        const name = lang === 'mr' ? w.name.mr : w.name.en;
        // Convert qtl→kg when user is on per-kg unit so the shared message
        // matches what they see in-app.
        const value = unit === 'kg' ? w.today.avg / 100 : w.today.avg;
        const suffix = unit === 'kg'
          ? (lang === 'mr' ? '/किलो' : '/kg')
          : (lang === 'mr' ? '/क्विं' : '/qtl');
        const formatted = unit === 'kg'
          ? value.toFixed(value < 100 ? 1 : 0)
          : value.toLocaleString('en-IN');
        return `• ${name}: ₹${formatted}${suffix}`;
      });
    const msg = `${dateStr} — ${lang === 'mr' ? 'आजचे बाजारभाव' : 'Market Rates'}\n\n${lines.join('\n')}\n\n${t.appName} ${lang === 'mr' ? 'ॲप' : 'app'}`;
    Share.share({ message: msg });
  };

  return (
    <SafeAreaView style={styles.wrap} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Hero — single column on the left, decorative illustration on the
            right kept small enough not to fight the headline for attention. */}
        <View style={styles.hero}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greet} numberOfLines={2}>{greet}{displayName}</Text>
            <Text style={styles.date}>{formatDate(meta.date, lang)}</Text>
            <View style={styles.heroChips}>
              <Pressable
                onPress={() => setVillagePickerOpen(true)}
                style={styles.villagePill}
                hitSlop={6}
              >
                <Text style={styles.villagePillText}>
                  {village.name[lang]}
                </Text>
              </Pressable>
              <View style={[styles.badge, marketOpen ? styles.badgeOpen : styles.badgeClosed]}>
                <View style={[styles.dot, marketOpen ? styles.dotOpen : styles.dotClosed]} />
                <Text style={styles.badgeText}>
                  {marketOpen ? t.homeMarketOpen : t.homeMarketClosed}
                </Text>
              </View>
            </View>
          </View>
          <FarmerHero width={108} height={92} />
        </View>

        {!IS_REAL && (
          <View style={styles.mockBanner}>
            <Text style={styles.mockText}>{t.profileMockBanner}</Text>
          </View>
        )}

        {meta.stale && <StaleBanner date={meta.date} />}

        <WeatherCard />

        <RainRadarStrip />

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

        {watched && watched.length > 0 && (
          <Pressable style={styles.shareRatesBtn} onPress={onShareRates}>
            <Text style={styles.shareRatesBtnText}>
              {lang === 'mr' ? 'WhatsApp वर भाव पाठवा' : "Share Today's Rates on WhatsApp"}
            </Text>
          </Pressable>
        )}

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

        {!loading && arrivals.length > 0 && (
          <>
            <SectionHeader title={lang === 'mr' ? 'आजची आवक' : "Today's Arrivals"} />
            <View style={styles.card}>
              {arrivals.slice(0, 5).map((item) => (
                <CommodityRow key={item.id} item={item} onPress={() => p.onOpenDetail(item.slug)} />
              ))}
            </View>
          </>
        )}

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
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  greet: { fontSize: font.xxl, fontWeight: '800', color: colors.text, lineHeight: font.xxl * 1.15 },
  date: { fontSize: font.sm, color: colors.textMuted, marginTop: 4 },
  heroChips: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
  villagePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  villagePillText: { fontSize: font.xs, fontWeight: '700', color: colors.primaryDark },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    gap: 6,
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
  shareRatesBtn: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    ...shadow.pop,
  },
  shareRatesBtnText: {
    fontSize: font.md,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
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
