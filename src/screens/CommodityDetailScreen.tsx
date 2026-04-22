import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, font, radius, shadow, spacing } from '../theme';
import { getCommodityDetail } from '../api/client';
import type { CommodityDetail } from '../types';
import { useSettings, useDict, useNumeralLang } from '../store/settingsStore';
import { useWatchlist } from '../store/watchlistStore';
import { emojiFor } from '../utils/icons';
import {
  formatArrival,
  formatDate,
  formatRupees,
  formatRupeesPerKg,
} from '../utils/format';
import { DeltaPill } from '../components/DeltaPill';
import { Sparkline } from '../components/Sparkline';
import { PriceChart } from '../components/PriceChart';
import { PremiumGate } from '../components/PremiumGate';
import { usePremium } from '../store/premiumStore';
import { getMultiMarket, type MultiMarketResponse } from '../api/premium';
import { CropCalendarCard } from '../components/CropCalendarCard';
import { ProfitCalculatorCard } from '../components/ProfitCalculatorCard';
import { CropStageRibbon } from '../components/CropStageRibbon';
import { WeeklyTasksCard } from '../components/WeeklyTasksCard';
import { FarmActionsStrip } from '../components/FarmActionsStrip';

type Props = {
  slug: string;
  onBack: () => void;
  onOpenPremium: () => void;
};

function getVerdict(detail: CommodityDetail): 'sell' | 'hold' | 'neutral' {
  const hist = detail.history30d;
  if (hist.length < 8) return 'neutral';
  const lastWeekAvg = hist.slice(-7).reduce((s, h) => s + h.avg, 0) / 7;
  const prevWeekAvg = hist.slice(-14, -7).reduce((s, h) => s + h.avg, 0) / 7;
  if (prevWeekAvg === 0) return 'neutral';
  const diff = ((lastWeekAvg - prevWeekAvg) / prevWeekAvg) * 100;
  if (diff > 4) return 'sell';
  if (diff < -4) return 'hold';
  return 'neutral';
}

export function CommodityDetailScreen({ slug, onBack, onOpenPremium }: Props) {
  const t = useDict();
  const lang = useSettings((s) => s.language);
  const nLang = useNumeralLang();
  const unit = useSettings((s) => s.unit);
  const isPremium = usePremium((s) => s.isActive());
  const [detail, setDetail] = useState<CommodityDetail | null>(null);
  const [multi, setMulti] = useState<MultiMarketResponse | null>(null);
  const [alertMin, setAlertMin] = useState('');
  const [alertMax, setAlertMax] = useState('');

  const toggleWatch = useWatchlist((s) => s.toggle);
  const setAlert = useWatchlist((s) => s.setAlert);
  const alerts = useWatchlist((s) => s.alerts);
  const watchedIds = useWatchlist((s) => s.ids);
  const isStarred = detail ? watchedIds.includes(detail.id) : false;

  useEffect(() => {
    let cancelled = false;
    getCommodityDetail(slug).then((d) => {
      if (!cancelled) setDetail(d);
      if (d) {
        const a = useWatchlist.getState().alerts[d.id];
        if (a) {
          setAlertMin(a.min != null ? String(a.min) : '');
          setAlertMax(a.max != null ? String(a.max) : '');
        }
      }
    });
    if (isPremium) {
      getMultiMarket(slug).then((r) => {
        if (!cancelled) setMulti(r);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [slug, isPremium]);

  if (!detail) {
    return (
      <SafeAreaView style={styles.wrap}>
        <Header title="" onBack={onBack} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      </SafeAreaView>
    );
  }

  const hasPrice = detail.today.avg > 0;
  const priceText = hasPrice
    ? unit === 'kg'
      ? formatRupeesPerKg(detail.today.avg, nLang)
      : formatRupees(detail.today.avg, nLang)
    : '—';
  const priceSuffix = unit === 'qtl' && hasPrice ? (lang === 'mr' ? '/क्विं' : '/qtl') : '';

  const verdict = getVerdict(detail);
  const verdictTitle =
    verdict === 'sell'
      ? t.detailVerdictSellTitle
      : verdict === 'hold'
        ? t.detailVerdictHoldTitle
        : t.detailVerdictNeutralTitle;
  const verdictBody =
    verdict === 'sell'
      ? t.detailVerdictSellBody
      : verdict === 'hold'
        ? t.detailVerdictHoldBody
        : t.detailVerdictNeutralBody;
  const verdictBg = verdict === 'sell' ? colors.upBg : verdict === 'hold' ? colors.downBg : colors.flatBg;
  const verdictFg = verdict === 'sell' ? colors.up : verdict === 'hold' ? colors.down : colors.flat;

  const onShare = () => {
    Share.share({
      message: t.shareMsg(
        detail.name[lang],
        priceText + priceSuffix,
        formatDate(detail.today.date, lang),
      ),
    });
  };

  const saveAlert = () => {
    const min = alertMin.trim() ? Number(alertMin) : null;
    const max = alertMax.trim() ? Number(alertMax) : null;
    setAlert(detail.id, min, max);
  };

  return (
    <SafeAreaView style={styles.wrap}>
      <Header title={detail.name[lang]} onBack={onBack} />
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>{emojiFor(detail.iconKey)}</Text>
          <Text style={styles.heroName}>{detail.name[lang]}</Text>
          <Text style={styles.heroOther}>{detail.name[lang === 'mr' ? 'en' : 'mr']}</Text>

          {hasPrice ? (
            <>
              <View style={styles.priceWrap}>
                <Text style={styles.price}>{priceText}</Text>
                {priceSuffix ? <Text style={styles.priceSuffix}>{priceSuffix}</Text> : null}
              </View>
              <View style={styles.deltaRow}>
                <DeltaPill deltaPct={detail.deltaPct} />
                <Text style={styles.deltaContext}>{t.vsYesterday}</Text>
              </View>
            </>
          ) : (
            <Text style={styles.noPrice}>{t.noPriceToday}</Text>
          )}
        </View>

        <View style={styles.statsRow}>
          <Stat
            label={t.priceMin}
            value={hasPrice ? formatRupees(detail.today.min, nLang) : '—'}
          />
          <Stat
            label={t.priceMax}
            value={hasPrice ? formatRupees(detail.today.max, nLang) : '—'}
          />
          <Stat
            label={t.arrival}
            value={formatArrival(detail.today.arrival, lang)}
          />
        </View>

        {hasPrice && (
          <View style={[styles.verdict, { backgroundColor: verdictBg }]}>
            <Text style={[styles.verdictTitle, { color: verdictFg }]}>{verdictTitle}</Text>
            <Text style={styles.verdictBody}>{verdictBody}</Text>
          </View>
        )}

        {hasPrice && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{t.detailTrend7d}</Text>
              <Sparkline data={detail.spark} width={120} height={36} />
            </View>
            <Text style={styles.cardTitle}>{t.detailTrend30d}</Text>
            <PriceChart data={detail.history30d} />
          </View>
        )}

        <View style={{ marginHorizontal: spacing.lg, marginTop: spacing.md }}>
          {isPremium ? (
            multi && multi.markets.length > 1 ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{t.multiMarketTitle}</Text>
                {multi.markets.map((m) => (
                  <View key={m.market} style={styles.mktRow}>
                    <Text style={styles.mktName}>{m.market.replace('apmc_', '').toUpperCase()}</Text>
                    <Text style={styles.mktPrice}>{formatRupees(m.today.avg, nLang)}</Text>
                    <Text style={styles.mktMeta}>
                      {formatRupees(m.today.min, nLang)}–{formatRupees(m.today.max, nLang)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null
          ) : (
            <PremiumGate onUnlock={onOpenPremium}>
              <Text style={{ color: colors.primaryDark, fontWeight: '600', textAlign: 'center' }}>
                {t.multiMarketTitle}
              </Text>
              <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs }}>
                {t.premiumFeatureMultiMarket}
              </Text>
            </PremiumGate>
          )}
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            style={[styles.action, isStarred ? styles.actionActive : styles.actionIdle]}
            onPress={() => toggleWatch(detail.id)}
          >
            <Text style={[styles.actionIcon, isStarred && { color: colors.accent }]}>
              {isStarred ? '★' : '☆'}
            </Text>
            <Text style={styles.actionText}>
              {isStarred ? t.detailRemoveWatch : t.detailAddWatch}
            </Text>
          </Pressable>
          <Pressable style={[styles.action, styles.actionIdle]} onPress={onShare}>
            <Text style={styles.actionIcon}>↗</Text>
            <Text style={styles.actionText}>{t.detailShare}</Text>
          </Pressable>
        </View>

        {hasPrice && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t.detailSetAlert}</Text>
            <Text style={styles.alertHint}>
              {lang === 'mr'
                ? 'भाव या मर्यादेपर्यंत पोहोचल्यास तुम्हाला नोटिफिकेशन मिळेल.'
                : "We'll notify you when the average price crosses these thresholds."}
            </Text>
            <View style={styles.alertRow}>
              <View style={styles.alertField}>
                <Text style={styles.alertLabel}>
                  {lang === 'mr' ? 'कमी झाल्यास' : 'Notify if below'}
                </Text>
                <TextInput
                  keyboardType="numeric"
                  value={alertMin}
                  onChangeText={setAlertMin}
                  style={styles.alertInput}
                  placeholder="—"
                  placeholderTextColor={colors.textSubtle}
                />
              </View>
              <View style={styles.alertField}>
                <Text style={styles.alertLabel}>
                  {lang === 'mr' ? 'वाढल्यास' : 'Notify if above'}
                </Text>
                <TextInput
                  keyboardType="numeric"
                  value={alertMax}
                  onChangeText={setAlertMax}
                  style={styles.alertInput}
                  placeholder="—"
                  placeholderTextColor={colors.textSubtle}
                />
              </View>
            </View>
            <Pressable style={styles.saveBtn} onPress={saveAlert}>
              <Text style={styles.saveBtnText}>{t.save}</Text>
            </Pressable>
            {alerts[detail.id] && (
              <Text style={styles.alertNote}>
                {lang === 'mr' ? '✓ अलर्ट सेट आहे' : '✓ Alert active'}
              </Text>
            )}
          </View>
        )}

        <CropStageRibbon commodityId={detail.id} iconKey={detail.iconKey} />

        <WeeklyTasksCard commodityId={detail.id} iconKey={detail.iconKey} />

        <FarmActionsStrip iconKey={detail.iconKey} />

        <CropCalendarCard iconKey={detail.iconKey} />

        {hasPrice && (
          <ProfitCalculatorCard pricePerQtl={detail.today.avg} />
        )}

        <Text style={styles.source}>
          {t.detailSource} · {formatDate(detail.today.date, lang)}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.topbar}>
      <Pressable onPress={onBack} hitSlop={10}>
        <Text style={styles.backIcon}>‹</Text>
      </Pressable>
      <Text style={styles.topbarTitle} numberOfLines={1}>
        {title}
      </Text>
      <View style={{ width: 28 }} />
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  backIcon: { fontSize: 32, color: colors.primary, paddingHorizontal: spacing.sm, marginTop: -4 },
  topbarTitle: { flex: 1, textAlign: 'center', fontSize: font.lg, fontWeight: '700', color: colors.text },
  hero: { alignItems: 'center', padding: spacing.xl },
  heroEmoji: { fontSize: 72, marginBottom: spacing.sm },
  heroName: { fontSize: font.xxl, fontWeight: '800', color: colors.text, textAlign: 'center' },
  heroOther: { fontSize: font.sm, color: colors.textMuted, marginTop: 2 },
  priceWrap: { flexDirection: 'row', alignItems: 'baseline', marginTop: spacing.lg },
  price: { fontSize: font.display + 8, fontWeight: '800', color: colors.primary },
  priceSuffix: { fontSize: font.lg, color: colors.textMuted, marginLeft: spacing.xs },
  noPrice: { marginTop: spacing.lg, fontSize: font.md, color: colors.textMuted },
  deltaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  deltaContext: { fontSize: font.sm, color: colors.textMuted },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    ...shadow.card,
  },
  stat: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: font.xs, color: colors.textMuted, marginBottom: 2 },
  statValue: { fontSize: font.md, fontWeight: '700', color: colors.text },
  verdict: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  verdictTitle: { fontSize: font.md, fontWeight: '700' },
  verdictBody: { fontSize: font.sm, color: colors.text, marginTop: 2 },
  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadow.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  cardTitle: { fontSize: font.md, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  actionsRow: { flexDirection: 'row', marginHorizontal: spacing.lg, marginTop: spacing.md, gap: spacing.md },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  actionIdle: { borderColor: colors.border, backgroundColor: colors.surface },
  actionActive: { borderColor: colors.accent, backgroundColor: '#FFF9E6' },
  actionIcon: { fontSize: font.lg, color: colors.text, fontWeight: '700' },
  actionText: { fontSize: font.sm, fontWeight: '600', color: colors.text },
  alertHint: { fontSize: font.xs, color: colors.textMuted, marginBottom: spacing.md },
  alertRow: { flexDirection: 'row', gap: spacing.md },
  alertField: { flex: 1 },
  alertLabel: { fontSize: font.xs, color: colors.textMuted, marginBottom: 4 },
  alertInput: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontSize: font.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700' },
  alertNote: { marginTop: spacing.sm, fontSize: font.xs, color: colors.success, textAlign: 'center' },
  mktRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  mktName: { flex: 1, color: colors.text, fontWeight: '600' },
  mktPrice: { color: colors.primaryDark, fontWeight: '800', fontSize: font.md, marginHorizontal: spacing.sm },
  mktMeta: { color: colors.textMuted, fontSize: font.xs },
  source: {
    textAlign: 'center',
    fontSize: font.xs,
    color: colors.textSubtle,
    marginTop: spacing.xl,
  },
});
