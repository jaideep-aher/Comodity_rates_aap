import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, font, radius, shadow, spacing } from '../theme';
import { useDict } from '../store/settingsStore';
import { usePremium } from '../store/premiumStore';
import { getPlans, startCheckout, verifyCheckout } from '../api/premium';
import type { PremiumPlan } from '../types';
import { track } from '../utils/analytics';

type Props = { onBack: () => void };

const FEATURE_KEYS: (keyof ReturnType<typeof useDict>)[] = [
  'premiumFeatureMultiMarket',
  'premiumFeatureHistory',
  'premiumFeatureSms',
  'premiumFeatureExport',
  'premiumFeatureSupport',
];

export function PremiumScreen({ onBack }: Props) {
  const t = useDict();
  const premium = usePremium();
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [selected, setSelected] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getPlans()
      .then((r) => setPlans(r.plans))
      .catch(() => {});
    premium.refresh();
  }, []);

  const active = premium.isActive();

  const handleSubscribe = async () => {
    setLoading(true);
    track('premium_subscribe_tapped', { plan: selected });
    try {
      const order = await startCheckout(selected);
      // If Razorpay isn't configured server-side, auto-verify with mock signature.
      if (order.isMock) {
        const ok = await verifyCheckout({
          orderId: order.orderId,
          paymentId: 'mock-pay-' + Date.now(),
          signature: 'mock-signature',
        });
        if (ok.ok) {
          premium.setLocal({
            active: true,
            plan: ok.plan,
            status: 'active',
            currentPeriodEnd: ok.currentPeriodEnd,
          });
          track('premium_subscribe_ok', { plan: ok.plan, mock: true });
          Alert.alert(t.premiumActive, '✓');
          return;
        }
      }
      // Real Razorpay checkout would open the native checkout sheet here.
      // For brevity, we show instructions. Wire `react-native-razorpay` in
      // production and pass order.orderId / order.amount to RazorpayCheckout.open().
      Alert.alert(
        'Razorpay',
        `Open RazorpayCheckout with order ${order.orderId}. After success call verifyCheckout().`,
      );
    } catch (err: any) {
      Alert.alert('Error', String(err?.message ?? err));
    } finally {
      setLoading(false);
    }
  };

  const fmt = (paise: number) => '₹' + Math.round(paise / 100).toLocaleString('en-IN');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>{t.premiumTitle}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>★ {t.premiumTitle}</Text>
          <Text style={styles.heroBody}>{t.premiumTagline}</Text>
        </View>

        <View style={styles.card}>
          {FEATURE_KEYS.map((k) => (
            <View key={k} style={styles.featureRow}>
              <Text style={styles.featureTick}>✓</Text>
              <Text style={styles.featureText}>{t[k] as string}</Text>
            </View>
          ))}
        </View>

        {active ? (
          <View style={[styles.card, { alignItems: 'center' }]}>
            <Text style={styles.activeTitle}>{t.premiumActive}</Text>
            {premium.sub.currentPeriodEnd ? (
              <Text style={styles.activeSub}>
                {t.premiumExpires} {new Date(premium.sub.currentPeriodEnd).toLocaleDateString()}
              </Text>
            ) : null}
          </View>
        ) : (
          <>
            <View style={styles.plansRow}>
              {plans.map((p) => {
                const isSel = p.id === selected;
                const label = p.id === 'monthly' ? t.premiumPlanMonthly : t.premiumPlanYearly;
                return (
                  <Pressable
                    key={p.id}
                    style={[styles.planCard, isSel && styles.planCardSelected]}
                    onPress={() => setSelected(p.id)}
                  >
                    <Text style={[styles.planLabel, isSel && styles.planLabelSelected]}>
                      {label}
                    </Text>
                    <Text style={[styles.planPrice, isSel && styles.planPriceSelected]}>
                      {fmt(p.amountPaise)}
                    </Text>
                    {p.id === 'yearly' ? (
                      <Text style={styles.planBadge}>{t.premiumYearlySavings}</Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              style={styles.cta}
              onPress={handleSubscribe}
              disabled={loading || plans.length === 0}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.ctaText}>{t.premiumSubscribe}</Text>
              )}
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.sm, marginRight: spacing.sm },
  backText: { fontSize: 28, color: colors.text },
  title: { fontSize: font.lg, fontWeight: '700', color: colors.text },
  content: { padding: spacing.lg },
  hero: {
    backgroundColor: colors.primaryDark,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  heroTitle: { color: '#fff', fontSize: font.xxl, fontWeight: '800' },
  heroBody: { color: '#E6F4EE', fontSize: font.md, marginTop: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  featureTick: { color: colors.success, fontWeight: '700', fontSize: font.lg, width: 28 },
  featureText: { color: colors.text, fontSize: font.md, flex: 1 },
  activeTitle: { color: colors.success, fontWeight: '700', fontSize: font.lg },
  activeSub: { color: colors.textMuted, marginTop: spacing.xs },
  plansRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  planCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
  },
  planCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  planLabel: { color: colors.textMuted, fontSize: font.sm, fontWeight: '600' },
  planLabelSelected: { color: colors.primaryDark },
  planPrice: { color: colors.text, fontSize: font.xxl, fontWeight: '800', marginTop: spacing.xs },
  planPriceSelected: { color: colors.primaryDark },
  planBadge: {
    marginTop: spacing.xs,
    color: colors.accent,
    fontWeight: '700',
    fontSize: font.xs,
  },
  cta: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontSize: font.lg, fontWeight: '700' },
});
