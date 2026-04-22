import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, font, radius, shadow, spacing } from '../theme';
import { useDict, useSettings, useNumeralLang } from '../store/settingsStore';
import { useCropInstances } from '../store/cropInstancesStore';
import { COMMODITIES } from '../data/commodities';
import { tasksForStage } from '../data/cropTasks';
import { lifecycleFor } from '../data/cropStages';
import { localiseNumber } from '../utils/format';
import type { TaskKind } from '../data/cropTasks';
import { KIND_EMOJI } from '../data/cropTasks';

type Props = { onBack: () => void };

type Entry = {
  commodityId: number;
  commodityName: { mr: string; en: string };
  iconKey: string;
  taskId: string;
  isoDate: string;
  kind: TaskKind;
  title: { mr: string; en: string };
};

// Looks up the task template so we can attach a human-readable title + kind
// to each diary entry. Falls back to a generic "✔ task" bubble when the
// template is missing (eg. if the task library changes between versions).
function resolveTemplate(iconKey: string, taskId: string) {
  const lc = lifecycleFor(iconKey);
  for (const stage of lc.stages) {
    const templates = tasksForStage(iconKey, stage.key);
    const hit = templates.find((tpl) => tpl.id === taskId);
    if (hit) return hit;
  }
  return null;
}

export function FarmDiaryScreen({ onBack }: Props) {
  const t = useDict();
  const lang = useSettings((s) => s.language);
  const nLang = useNumeralLang();
  const instances = useCropInstances((s) => s.byId);
  const resetInstance = useCropInstances((s) => s.reset);

  const entries = useMemo(() => {
    const out: Entry[] = [];
    for (const id of Object.keys(instances)) {
      const inst = instances[Number(id)];
      const c = COMMODITIES.find((x) => x.id === inst.commodityId);
      if (!c) continue;
      for (const [taskId, iso] of Object.entries(inst.tasksDone)) {
        const tpl = resolveTemplate(c.iconKey, taskId);
        out.push({
          commodityId: c.id,
          commodityName: c.name,
          iconKey: c.iconKey,
          taskId,
          isoDate: iso,
          kind: tpl?.kind ?? 'monitor',
          title: tpl?.title ?? { mr: 'नोंद', en: 'Entry' },
        });
      }
    }
    // Most recent first.
    return out.sort((a, b) => (a.isoDate > b.isoDate ? -1 : 1));
  }, [instances]);

  const tally = useMemo(() => {
    const counts: Record<TaskKind, number> = {
      irrigate: 0, spray: 0, fertilize: 0, weed: 0, harvest: 0, prune: 0, monitor: 0,
    };
    for (const e of entries) counts[e.kind] = (counts[e.kind] ?? 0) + 1;
    return counts;
  }, [entries]);

  const activeCrops = useMemo(
    () =>
      Object.values(instances)
        .filter((i) => i.sowingDate)
        .map((i) => {
          const c = COMMODITIES.find((x) => x.id === i.commodityId);
          return { inst: i, c };
        })
        .filter((x): x is { inst: typeof x.inst; c: NonNullable<typeof x.c> } => !!x.c),
    [instances],
  );

  return (
    <SafeAreaView style={styles.wrap} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={16}>
          <Text style={styles.back}>‹ {t.back}</Text>
        </Pressable>
        <Text style={styles.title}>📓 {t.diaryTitle}</Text>
        <Text style={styles.subtitle}>{t.diarySub}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
        <View style={styles.tallyCard}>
          <Text style={styles.tallyTitle}>{t.diaryTally}</Text>
          <View style={styles.tallyRow}>
            {(Object.keys(tally) as TaskKind[])
              .filter((k) => tally[k] > 0)
              .map((k) => (
                <View key={k} style={styles.tallyChip}>
                  <Text style={styles.tallyEmoji}>{KIND_EMOJI[k]}</Text>
                  <Text style={styles.tallyCount}>{localiseNumber(tally[k], nLang)}</Text>
                </View>
              ))}
            {entries.length === 0 && (
              <Text style={styles.emptyTally}>{t.diaryEmpty}</Text>
            )}
          </View>
        </View>

        {activeCrops.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.diaryActiveCrops}</Text>
            {activeCrops.map(({ inst, c }) => (
              <View key={c.id} style={styles.cropCard}>
                <Text style={styles.cropName}>{c.name[lang]}</Text>
                <Text style={styles.cropMeta}>
                  🌱{' '}
                  {lang === 'mr'
                    ? `पेरणी: ${inst.sowingDate}`
                    : `Sowing: ${inst.sowingDate}`}
                  {inst.variety ? `  ·  ${inst.variety}` : ''}
                </Text>
                <Pressable
                  onPress={() => resetInstance(c.id)}
                  style={styles.resetLink}
                >
                  <Text style={styles.resetLinkText}>{t.diaryReset}</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.diaryLog}</Text>
          {entries.length === 0 && (
            <Text style={styles.emptyLog}>{t.diaryEmptyLog}</Text>
          )}
          {entries.map((e) => (
            <View key={`${e.commodityId}-${e.taskId}`} style={styles.logRow}>
              <Text style={styles.logEmoji}>{KIND_EMOJI[e.kind]}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.logTitle}>{e.title[lang]}</Text>
                <Text style={styles.logMeta}>
                  {e.commodityName[lang]} · {e.isoDate}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 4,
  },
  back: { color: colors.primary, fontWeight: '700', fontSize: font.sm },
  title: { fontSize: font.xl, fontWeight: '800', color: colors.text, marginTop: 4 },
  subtitle: { fontSize: font.sm, color: colors.textMuted },

  tallyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.card,
  },
  tallyTitle: {
    fontSize: font.xs, color: colors.textMuted,
    fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  tallyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tallyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  tallyEmoji: { fontSize: 16 },
  tallyCount: { fontSize: font.sm, fontWeight: '800', color: colors.primaryDark },
  emptyTally: { fontSize: font.sm, color: colors.textMuted },

  section: { marginTop: spacing.lg },
  sectionTitle: {
    fontSize: font.xs, color: colors.textMuted,
    fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  cropCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  cropName: { fontSize: font.md, fontWeight: '800', color: colors.text },
  cropMeta: { fontSize: font.sm, color: colors.textMuted, marginTop: 2 },
  resetLink: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  resetLinkText: { fontSize: font.xs, color: colors.down, fontWeight: '700' },

  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: 6,
  },
  logEmoji: { fontSize: 22 },
  logTitle: { fontSize: font.md, color: colors.text, fontWeight: '700' },
  logMeta: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },
  emptyLog: { fontSize: font.sm, color: colors.textMuted, lineHeight: 20 },
});
