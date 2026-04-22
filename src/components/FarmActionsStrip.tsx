import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, shadow, spacing } from '../theme';
import { useDict, useSettings } from '../store/settingsStore';
import { evaluateAllActions, VERDICT_COLOR, type ActionVerdict } from '../utils/advisor';
import { getWeather } from '../data/weather';
import { TODAY_ISO } from '../data/mockData';
import { useWatchlist } from '../store/watchlistStore';
import { COMMODITIES } from '../data/commodities';
import { TtsButton } from './TtsButton';
import { useLiveWeather } from '../hooks/useLiveWeather';

type Props = {
  // Optional commodity iconKey when rendering inside the commodity detail —
  // lets the advisor apply crop-specific spray thresholds.
  iconKey?: string | null;
};

export function FarmActionsStrip({ iconKey }: Props) {
  const t = useDict();
  const lang = useSettings((s) => s.language);
  const watchIds = useWatchlist((s) => s.ids);
  const [active, setActive] = useState<ActionVerdict | null>(null);

  const resolvedIcon = useMemo(() => {
    if (iconKey) return iconKey;
    // No explicit crop (eg. home screen) — pick the first watchlisted crop's
    // iconKey so spray rules are at least loosely personalised.
    const first = watchIds[0];
    if (!first) return null;
    return COMMODITIES.find((c) => c.id === first)?.iconKey ?? null;
  }, [iconKey, watchIds]);

  const live = useLiveWeather();
  const days = live.days.length > 0 ? live.days : getWeather(TODAY_ISO);
  if (days.length === 0) return null;
  const [today, ...rest] = days;
  const actions = evaluateAllActions(today, rest, resolvedIcon);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.actionsTitle}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {actions.map((a) => {
          const c = VERDICT_COLOR[a.verdict];
          return (
            <Pressable
              key={a.action}
              style={({ pressed }) => [
                styles.chip,
                { backgroundColor: c.bg, borderColor: c.fg },
                pressed && { opacity: 0.85 },
              ]}
              onPress={() => setActive(a)}
            >
              <Text style={styles.chipEmoji}>{a.emoji}</Text>
              <Text style={[styles.chipTitle, { color: c.fg }]} numberOfLines={1}>
                {a.title[lang]}
              </Text>
              <Text style={[styles.chipBadge, { color: c.fg }]}>
                {c.badge}{'  '}
                {a.verdict === 'ok'
                  ? t.verdictOk
                  : a.verdict === 'warn'
                    ? t.verdictWarn
                    : t.verdictAvoid}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Modal
        transparent
        visible={active != null}
        animationType="fade"
        onRequestClose={() => setActive(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setActive(null)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            {active && (
              <>
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetEmoji}>{active.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetTitle}>{active.title[lang]}</Text>
                    <Text
                      style={[
                        styles.sheetVerdict,
                        { color: VERDICT_COLOR[active.verdict].fg },
                      ]}
                    >
                      {VERDICT_COLOR[active.verdict].badge}{'  '}
                      {active.verdict === 'ok'
                        ? t.verdictOk
                        : active.verdict === 'warn'
                          ? t.verdictWarn
                          : t.verdictAvoid}
                    </Text>
                  </View>
                  <TtsButton text={`${active.title[lang]}. ${active.reason[lang]}`} />
                </View>
                <Text style={styles.sheetReason}>{active.reason[lang]}</Text>
                <Pressable style={styles.sheetClose} onPress={() => setActive(null)}>
                  <Text style={styles.sheetCloseText}>{t.done}</Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadow.card,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  title: {
    flex: 1,
    fontSize: font.md,
    fontWeight: '800',
    color: colors.text,
  },
  row: { gap: spacing.sm, paddingRight: spacing.md },
  chip: {
    minWidth: 132,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    gap: 2,
  },
  chipEmoji: { fontSize: 24 },
  chipTitle: { fontSize: font.sm, fontWeight: '800', marginTop: 2 },
  chipBadge: { fontSize: font.xs, fontWeight: '700' },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sheetEmoji: { fontSize: 40 },
  sheetTitle: { fontSize: font.xl, fontWeight: '800', color: colors.text },
  sheetVerdict: { fontSize: font.sm, fontWeight: '700', marginTop: 2 },
  sheetReason: {
    fontSize: font.md,
    color: colors.text,
    lineHeight: 24,
    backgroundColor: colors.bgAlt,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  sheetClose: {
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    ...shadow.pop,
  },
  sheetCloseText: { color: '#fff', fontWeight: '800', fontSize: font.md },
});
