import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, shadow, spacing } from '../theme';
import { useDict, useSettings, useNumeralLang } from '../store/settingsStore';
import { lifecycleFor, stageAt } from '../data/cropStages';
import { tasksForStage, KIND_EMOJI } from '../data/cropTasks';
import { useCropInstances, daysSince } from '../store/cropInstancesStore';
import { TODAY_ISO } from '../data/mockData';
import { getWeather } from '../data/weather';
import { evaluateAllActions } from '../utils/advisor';
import { TtsButton } from './TtsButton';
import { localiseNumber } from '../utils/format';

type Props = { commodityId: number; iconKey: string };

export function WeeklyTasksCard({ commodityId, iconKey }: Props) {
  const t = useDict();
  const lang = useSettings((s) => s.language);
  const nLang = useNumeralLang();
  const instance = useCropInstances((s) => s.byId[commodityId]);
  const markDone = useCropInstances((s) => s.markTaskDone);
  const unmark = useCropInstances((s) => s.unmarkTask);

  if (!instance?.sowingDate) return null;

  const days = daysSince(instance.sowingDate);
  const stage = stageAt(iconKey, days);
  const lifecycle = lifecycleFor(iconKey);
  const stageFromDay =
    lifecycle.stages.find((s) => s.key === stage.key)?.fromDay ?? 0;
  const daysIntoStage = Math.max(0, days - stageFromDay);

  const templates = tasksForStage(iconKey, stage.key);

  // Re-order: overdue / current first, then upcoming.
  const ordered = [...templates].sort((a, b) => a.offsetInStage - b.offsetInStage);

  // Weather-aware recommendation: show a soft reshuffle note when the "spray"
  // task conflicts with today's weather.
  const weather = getWeather(TODAY_ISO);
  const sprayVerdict =
    weather.length > 0
      ? evaluateAllActions(weather[0], weather.slice(1), iconKey).find(
          (a) => a.action === 'spray',
        )
      : null;
  const weatherNoteForKind = (kind: string): string | null => {
    if (kind === 'spray' && sprayVerdict && sprayVerdict.verdict !== 'ok') {
      return sprayVerdict.reason[lang];
    }
    return null;
  };

  const ttsText = ordered
    .map((task) => `${task.title[lang]}. ${task.detail[lang]}.`)
    .join(' ');

  if (ordered.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>📋  {t.weeklyTasksTitle}</Text>
        <Text style={styles.empty}>{t.weeklyTasksEmpty}</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>📋  {t.weeklyTasksTitle}</Text>
        <TtsButton text={ttsText} compact />
      </View>
      <Text style={styles.subTitle}>
        {stage.emoji}  {stage.name[lang]} · {
          lang === 'mr'
            ? `${localiseNumber(daysIntoStage, nLang)} दिवस झाले`
            : `${localiseNumber(daysIntoStage, nLang)} days in stage`
        }
      </Text>

      {ordered.map((task) => {
        const done = !!instance.tasksDone[task.id];
        const overdue = !done && daysIntoStage >= task.offsetInStage;
        const note = weatherNoteForKind(task.kind);
        return (
          <Pressable
            key={task.id}
            style={[styles.row, done && styles.rowDone]}
            onPress={() =>
              done
                ? unmark(commodityId, task.id)
                : markDone(commodityId, task.id, TODAY_ISO)
            }
          >
            <View
              style={[
                styles.check,
                done ? styles.checkDone : overdue ? styles.checkOverdue : styles.checkIdle,
              ]}
            >
              <Text style={styles.checkIcon}>
                {done ? '✓' : overdue ? '!' : KIND_EMOJI[task.kind]}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, done && styles.rowTitleDone]} numberOfLines={2}>
                {task.title[lang]}
              </Text>
              <Text style={styles.rowDetail} numberOfLines={2}>
                {task.detail[lang]}
              </Text>
              {note && (
                <Text style={styles.rowWarn}>⚠️  {note}</Text>
              )}
            </View>
            <Text style={styles.rowAction}>
              {done ? t.taskDone : t.taskMarkDone}
            </Text>
          </Pressable>
        );
      })}
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
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1, fontSize: font.md, fontWeight: '800', color: colors.text },
  subTitle: {
    fontSize: font.sm,
    color: colors.primaryDark,
    fontWeight: '700',
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  empty: { marginTop: spacing.sm, fontSize: font.sm, color: colors.textMuted, lineHeight: 20 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  rowDone: { opacity: 0.55 },
  check: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.bgAlt,
  },
  checkIdle: { backgroundColor: colors.bgAlt },
  checkOverdue: { backgroundColor: colors.downBg },
  checkDone: { backgroundColor: colors.upBg },
  checkIcon: { fontSize: 18, color: colors.text, fontWeight: '800' },
  rowTitle: { fontSize: font.sm, fontWeight: '800', color: colors.text },
  rowTitleDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  rowDetail: { fontSize: font.xs, color: colors.textMuted, marginTop: 2, lineHeight: 16 },
  rowWarn: {
    marginTop: 4,
    fontSize: 10,
    color: colors.warning,
    fontWeight: '700',
  },
  rowAction: {
    fontSize: font.xs,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: spacing.sm,
  },
});
