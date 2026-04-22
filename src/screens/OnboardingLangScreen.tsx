import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, font, radius, shadow, spacing } from '../theme';
import { useSettings } from '../store/settingsStore';
import { DICT } from '../i18n';
import type { Language } from '../types';
import { FarmerHero } from '../components/illustrations/FarmerHero';

type Props = {
  onNext: () => void;
};

export function OnboardingLangScreen({ onNext }: Props) {
  const language = useSettings((s) => s.language);
  const setLanguage = useSettings((s) => s.setLanguage);
  const t = DICT[language];

  const pick = (lang: Language) => setLanguage(lang);

  return (
    <SafeAreaView style={styles.wrap}>
      <View style={styles.hero}>
        <FarmerHero width={240} height={200} />
        <Text style={styles.title}>{t.appName}</Text>
        <Text style={styles.sub}>{t.tagline}</Text>
        <Text style={styles.brag}>{t.heroBrag}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.question}>{t.onboardingLangTitle}</Text>
        <Text style={styles.questionSub}>{t.onboardingLangSubtitle}</Text>

        <Pressable
          onPress={() => pick('mr')}
          style={[styles.option, language === 'mr' && styles.optionActive]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.optionText, language === 'mr' && styles.optionTextActive]}>मराठी</Text>
            <Text style={[styles.optionSub, language === 'mr' && { color: '#E6F4EE' }]}>
              संपूर्ण ॲप मराठीत
            </Text>
          </View>
          <Text style={[styles.optionCheck, language === 'mr' && { color: '#fff' }]}>
            {language === 'mr' ? '✓' : ''}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => pick('en')}
          style={[styles.option, language === 'en' && styles.optionActive]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.optionText, language === 'en' && styles.optionTextActive]}>English</Text>
            <Text style={[styles.optionSub, language === 'en' && { color: '#E6F4EE' }]}>
              Switch to English
            </Text>
          </View>
          <Text style={[styles.optionCheck, language === 'en' && { color: '#fff' }]}>
            {language === 'en' ? '✓' : ''}
          </Text>
        </Pressable>
      </View>

      <Pressable style={styles.cta} onPress={onNext}>
        <Text style={styles.ctaText}>{t.continue}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  hero: { alignItems: 'center', paddingTop: spacing.xl, paddingBottom: spacing.lg },
  title: { fontSize: font.display, fontWeight: '800', color: colors.primary, marginTop: spacing.sm },
  sub: { fontSize: font.md, color: colors.textMuted, marginTop: 4 },
  brag: {
    fontSize: font.sm,
    color: colors.primaryDark,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    overflow: 'hidden',
    textAlign: 'center',
  },
  body: { flex: 1, paddingHorizontal: spacing.lg },
  question: { fontSize: font.xl, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  questionSub: { fontSize: font.sm, color: colors.textMuted, marginBottom: spacing.xl },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.soft,
  },
  optionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText: { fontSize: font.xl, fontWeight: '700', color: colors.text },
  optionTextActive: { color: '#fff' },
  optionSub: { fontSize: font.sm, color: colors.textMuted, marginTop: 2 },
  optionCheck: { fontSize: font.xl, fontWeight: '700', color: 'transparent' },
  cta: {
    backgroundColor: colors.primary,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    ...shadow.pop,
  },
  ctaText: { color: '#fff', fontSize: font.lg, fontWeight: '700' },
});
