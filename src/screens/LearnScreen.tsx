import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, font, radius, shadow, spacing } from '../theme';
import { useDict } from '../store/settingsStore';
import { WeatherCard } from '../components/WeatherCard';
import { TipOfDay } from '../components/TipOfDay';
import { NewsTeaser } from '../components/NewsTeaser';
import { SectionHeader } from '../components/SectionHeader';
import { QuickTools } from '../components/QuickTools';
import { FarmActionsStrip } from '../components/FarmActionsStrip';
import { RainRadarStrip } from '../components/RainRadarStrip';
import { SowNowStrip } from '../components/SowNowStrip';

type Props = {
  onOpenNews: () => void;
  onOpenSchemes: () => void;
  onOpenHelpline: () => void;
  onOpenVideos: () => void;
  onOpenCropDoctor: () => void;
  onOpenMarkets: () => void;
  onOpenDetail: (slug: string) => void;
  onOpenAskAdvisor: () => void;
  onOpenFarmDiary: () => void;
};

export function LearnScreen(p: Props) {
  const t = useDict();
  return (
    <SafeAreaView style={styles.wrap} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.learnTitle}</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <View style={styles.stage6Row}>
          <Pressable style={styles.stage6Card} onPress={p.onOpenAskAdvisor}>
            <Text style={styles.stage6Emoji}>🤖</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.stage6Title}>{t.askAdvisorHomeTitle}</Text>
              <Text style={styles.stage6Body}>{t.askAdvisorHomeSub}</Text>
            </View>
          </Pressable>
          <Pressable style={styles.stage6Card} onPress={p.onOpenFarmDiary}>
            <Text style={styles.stage6Emoji}>📓</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.stage6Title}>{t.diaryTitle}</Text>
              <Text style={styles.stage6Body}>{t.diarySub}</Text>
            </View>
          </Pressable>
        </View>
        <FarmActionsStrip />
        <WeatherCard />
        <RainRadarStrip />
        <SowNowStrip onOpenDetail={p.onOpenDetail} />
        <TipOfDay />
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
        <NewsTeaser onOpenAll={p.onOpenNews} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { fontSize: font.xxl, fontWeight: '800', color: colors.text },
  stage6Row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  stage6Card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadow.card,
  },
  stage6Emoji: { fontSize: 28 },
  stage6Title: { fontSize: font.sm, fontWeight: '800', color: colors.text },
  stage6Body: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
});
