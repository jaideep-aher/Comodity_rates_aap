import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, font, radius, shadow, spacing } from '../theme';
import { useSettings, useDict } from '../store/settingsStore';
import { useWatchlist } from '../store/watchlistStore';
import { getToday } from '../api/client';
import type { CommodityWithPrice } from '../types';
import { emojiFor } from '../utils/icons';
import { formatRupees } from '../utils/format';
import { DeltaPill } from '../components/DeltaPill';

type Props = { onOpenDetail: (slug: string) => void };

export function AlertsScreen({ onOpenDetail }: Props) {
  const t = useDict();
  const lang = useSettings((s) => s.language);
  const alerts = useWatchlist((s) => s.alerts);
  const watchIds = useWatchlist((s) => s.ids);
  const clearAlert = useWatchlist((s) => s.clearAlert);
  const [watched, setWatched] = useState<CommodityWithPrice[]>([]);

  useEffect(() => {
    if (watchIds.length === 0) {
      setWatched([]);
      return;
    }
    getToday({ ids: watchIds }).then((r) => setWatched(r.items));
  }, [watchIds.join(',')]);

  const simulateDigest = () => {
    const top = watched.filter((w) => w.today.avg > 0).slice(0, 5);
    if (top.length === 0) {
      Alert.alert(
        lang === 'mr' ? 'पिके जोडा' : 'Add crops',
        lang === 'mr' ? 'आधी watchlist मध्ये पिके जोडा.' : 'Add crops to your watchlist first.',
      );
      return;
    }
    const lines = top.map((w) => {
      const arrow = w.deltaPct > 0.1 ? '▲' : w.deltaPct < -0.1 ? '▼' : '–';
      return `• ${w.name[lang]} ${formatRupees(w.today.avg)} ${arrow}${Math.abs(w.deltaPct).toFixed(1)}%`;
    });
    const greeting = lang === 'mr' ? 'सुप्रभात! आजचे भाव:\n\n' : 'Good morning! Prices today:\n\n';
    Alert.alert(t.alertsDigestPreviewTitle, greeting + lines.join('\n'));
  };

  const alertEntries = Object.values(alerts);

  return (
    <SafeAreaView style={styles.wrap} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.alertsTitle}</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <Pressable style={styles.digestCard} onPress={simulateDigest}>
          <Text style={styles.digestIcon}>🔔</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.digestTitle}>
              {lang === 'mr' ? 'दैनिक सारांश' : 'Daily digest'}
            </Text>
            <Text style={styles.digestSub}>
              {lang === 'mr'
                ? 'रोज सकाळी ७:३० ला तुमच्या पिकांचे भाव.'
                : 'Your crop prices every morning at 7:30 AM.'}
            </Text>
          </View>
          <Text style={styles.digestCta}>
            {lang === 'mr' ? 'पहा ›' : 'Preview ›'}
          </Text>
        </Pressable>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {lang === 'mr' ? 'भाव अलर्ट्स' : 'Price thresholds'}
          </Text>
          {alertEntries.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>⚙️</Text>
              <Text style={styles.emptyText}>{t.alertsEmpty}</Text>
              <Text style={styles.emptyHint}>
                {lang === 'mr'
                  ? 'कोणत्याही पिकाच्या पृष्ठावर जाऊन अलर्ट सेट करा.'
                  : 'Open any commodity and set a price alert.'}
              </Text>
            </View>
          ) : (
            <View style={styles.card}>
              {alertEntries.map((a) => {
                const c = watched.find((w) => w.id === a.commodityId);
                if (!c) return null;
                return (
                  <Pressable
                    key={a.commodityId}
                    style={styles.row}
                    onPress={() => onOpenDetail(c.slug)}
                  >
                    <Text style={styles.rowEmoji}>{emojiFor(c.iconKey)}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowName}>{c.name[lang]}</Text>
                      <View style={styles.rowMeta}>
                        <Text style={styles.rowMetaText}>
                          {lang === 'mr' ? 'आज:' : 'Now:'} {formatRupees(c.today.avg)}
                        </Text>
                        <DeltaPill deltaPct={c.deltaPct} size="sm" />
                      </View>
                      <View style={styles.thresholds}>
                        {a.min != null && (
                          <Text style={styles.threshold}>
                            ▼ {lang === 'mr' ? 'खाली' : 'below'} {formatRupees(a.min)}
                          </Text>
                        )}
                        {a.max != null && (
                          <Text style={styles.threshold}>
                            ▲ {lang === 'mr' ? 'वर' : 'above'} {formatRupees(a.max)}
                          </Text>
                        )}
                      </View>
                    </View>
                    <Pressable
                      hitSlop={10}
                      onPress={() => clearAlert(a.commodityId)}
                    >
                      <Text style={styles.clearIcon}>×</Text>
                    </Pressable>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { fontSize: font.xxl, fontWeight: '800', color: colors.text },
  digestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: radius.lg,
    ...shadow.card,
  },
  digestIcon: { fontSize: 32 },
  digestTitle: { color: '#fff', fontSize: font.lg, fontWeight: '700' },
  digestSub: { color: 'rgba(255,255,255,0.85)', fontSize: font.sm, marginTop: 2 },
  digestCta: { color: '#fff', fontWeight: '700' },
  section: { marginTop: spacing.xl },
  sectionTitle: {
    paddingHorizontal: spacing.lg,
    fontSize: font.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  empty: {
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadow.card,
  },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: font.md, fontWeight: '600', color: colors.text, marginTop: spacing.md },
  emptyHint: { fontSize: font.sm, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  card: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowEmoji: { fontSize: 30 },
  rowName: { fontSize: font.md, fontWeight: '600', color: colors.text },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
  rowMetaText: { fontSize: font.xs, color: colors.textMuted },
  thresholds: { flexDirection: 'row', gap: spacing.md, marginTop: 4 },
  threshold: { fontSize: font.xs, color: colors.textMuted },
  clearIcon: { fontSize: 24, color: colors.textMuted, paddingHorizontal: spacing.sm },
});
