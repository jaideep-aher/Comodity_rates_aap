import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, shadow, spacing } from '../theme';
import { useDict, useSettings, useNumeralLang } from '../store/settingsStore';
import { lifecycleFor, stageAt } from '../data/cropStages';
import { localiseNumber } from '../utils/format';
import { SowingDateModal } from './SowingDateModal';
import { useCropInstances, daysSince } from '../store/cropInstancesStore';

type Props = {
  commodityId: number;
  iconKey: string;
};

export function CropStageRibbon({ commodityId, iconKey }: Props) {
  const t = useDict();
  const lang = useSettings((s) => s.language);
  const nLang = useNumeralLang();
  const instance = useCropInstances((s) => s.byId[commodityId]);
  const setSowing = useCropInstances((s) => s.setSowingDate);
  const setVariety = useCropInstances((s) => s.setVariety);
  const [pickerOpen, setPickerOpen] = useState(false);

  const saveSowing = (iso: string | null, variety?: string | null) => {
    setSowing(commodityId, iso);
    if (variety !== undefined) setVariety(commodityId, variety);
  };

  const lifecycle = lifecycleFor(iconKey, instance?.variety);
  const hasDate = !!instance?.sowingDate;
  const days = hasDate ? daysSince(instance!.sowingDate!) : 0;
  const current = hasDate ? stageAt(iconKey, days, instance?.variety) : null;
  const currentIndex = current
    ? lifecycle.stages.findIndex((s) => s.key === current.key)
    : -1;

  if (!hasDate) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>🌱  {t.stageRibbonTitle}</Text>
        <Text style={styles.promptBody}>{t.sowingPromptBody}</Text>
        <Pressable style={styles.promptCta} onPress={() => setPickerOpen(true)}>
          <Text style={styles.promptCtaText}>{t.sowingAddDate}</Text>
        </Pressable>
        <SowingDateModal
          visible={pickerOpen}
          iconKey={iconKey}
          onClose={() => setPickerOpen(false)}
          onSave={saveSowing}
        />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>🌱  {t.stageRibbonTitle}</Text>
        <Pressable onPress={() => setPickerOpen(true)} hitSlop={6}>
          <Text style={styles.editLink}>
            {lang === 'mr' ? 'बदला' : 'Edit'}
          </Text>
        </Pressable>
      </View>

      {current && (
        <View style={styles.currentBanner}>
          <Text style={styles.currentEmoji}>{current.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.currentName}>{current.name[lang]}</Text>
            <Text style={styles.currentMeta}>
              {lang === 'mr'
                ? `आज दिवस ${localiseNumber(days, nLang)} / ${localiseNumber(lifecycle.totalDays, nLang)}`
                : `Day ${localiseNumber(days, nLang)} of ${localiseNumber(lifecycle.totalDays, nLang)}`}
            </Text>
            <Text style={styles.currentHint}>{current.hint[lang]}</Text>
          </View>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.ribbonRow}
      >
        {lifecycle.stages.map((s, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <View key={s.key} style={styles.stageWrap}>
              {i > 0 && (
                <View
                  style={[
                    styles.connector,
                    done ? styles.connectorDone : styles.connectorIdle,
                  ]}
                />
              )}
              <View
                style={[
                  styles.node,
                  done && styles.nodeDone,
                  active && styles.nodeActive,
                ]}
              >
                <Text style={[styles.nodeEmoji, active && styles.nodeEmojiActive]}>
                  {done ? '✓' : s.emoji}
                </Text>
              </View>
              <Text
                style={[
                  styles.stageLabel,
                  active && styles.stageLabelActive,
                ]}
                numberOfLines={2}
              >
                {s.name[lang]}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <SowingDateModal
        visible={pickerOpen}
        iconKey={iconKey}
        initial={instance?.sowingDate}
        initialVariety={instance?.variety}
        onClose={() => setPickerOpen(false)}
        onSave={saveSowing}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadow.card,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  title: { flex: 1, fontSize: font.md, fontWeight: '800', color: colors.text },
  editLink: { fontSize: font.sm, color: colors.primary, fontWeight: '700' },

  promptBody: {
    marginTop: spacing.xs, fontSize: font.sm, color: colors.textMuted, lineHeight: 20,
  },
  promptCta: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    ...shadow.pop,
  },
  promptCtaText: { color: '#fff', fontWeight: '800', fontSize: font.md },

  currentBanner: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.md,
  },
  currentEmoji: { fontSize: 36 },
  currentName: { fontSize: font.md, fontWeight: '800', color: colors.primaryDark },
  currentMeta: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },
  currentHint: { fontSize: font.sm, color: colors.text, marginTop: 4, lineHeight: 18 },

  ribbonRow: {
    paddingVertical: spacing.md,
    paddingHorizontal: 2,
    alignItems: 'flex-start',
  },
  stageWrap: { width: 80, alignItems: 'center' },
  connector: {
    position: 'absolute',
    top: 22, left: -20, width: 40, height: 3,
    borderRadius: 2,
  },
  connectorDone: { backgroundColor: colors.primary },
  connectorIdle: { backgroundColor: colors.border },
  node: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.bgAlt,
    borderWidth: 2, borderColor: colors.border,
  },
  nodeDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  nodeActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
    transform: [{ scale: 1.1 }],
  },
  nodeEmoji: { fontSize: 20 },
  nodeEmojiActive: { fontSize: 22 },
  stageLabel: {
    marginTop: 6,
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    fontWeight: '600',
  },
  stageLabelActive: { color: colors.accent, fontWeight: '800' },
});
