import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, font, radius, shadow, spacing } from '../theme';
import { Sprout } from '../components/illustrations/Sprout';
import { useDict, useSettings } from '../store/settingsStore';

type Props = { onBack: () => void };

// Lightweight placeholder for a Plantix-style crop doctor. We don't bundle a
// computer-vision model — when the user taps "Call", we route them to the
// Kisan Call Centre, which offers expert diagnosis over the phone today.
// When the ML pipeline ships, this screen swaps in an image picker.
export function CropDoctorScreen({ onBack }: Props) {
  const t = useDict();
  const lang = useSettings((s) => s.language);

  const tips = lang === 'mr'
    ? [
        { title: 'पानांवर पिवळे डाग', body: 'नत्राची कमतरता. युरिया १% फवारा.' },
        { title: 'पाने सुकताहेत', body: 'पाण्याचा निचरा तपासा. जास्त पाणी असल्यास चर काढा.' },
        { title: 'पांढरी माशी', body: 'निंबोळी अर्क ५% + चिकट सापळे लावा.' },
        { title: 'फळांवर काळे डाग', body: 'अँथ्रॅकनोज. कार्बेन्डाझिम ०.१% फवारा.' },
      ]
    : [
        { title: 'Yellow spots on leaves', body: 'Nitrogen deficiency. Spray 1% urea.' },
        { title: 'Wilting leaves', body: 'Check drainage. Drain excess water.' },
        { title: 'Whitefly infestation', body: 'Apply 5% neem extract + sticky traps.' },
        { title: 'Black spots on fruit', body: 'Anthracnose. Spray 0.1% Carbendazim.' },
      ];

  return (
    <SafeAreaView style={styles.wrap} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={16}>
          <Text style={styles.back}>‹ {t.back}</Text>
        </Pressable>
        <Text style={styles.title}>{t.learnCropDoctor}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
        <View style={styles.hero}>
          <Sprout width={120} height={120} />
          <Text style={styles.heroTitle}>
            {lang === 'mr' ? 'पिकाच्या समस्येचा फोटो घ्या' : 'Photograph your crop problem'}
          </Text>
          <Text style={styles.heroBody}>
            {lang === 'mr'
              ? 'लवकरच: फोटो अपलोड करून रोग व उपाय AI कडून मिळवा. तोपर्यंत किसान कॉल सेंटरशी मोफत संपर्क साधा.'
              : 'Coming soon: upload a photo and get AI-suggested diagnosis. Until then, speak to the free Kisan Call Centre.'}
          </Text>
          <Pressable style={styles.cta} onPress={() => Linking.openURL('tel:18001801551')}>
            <Text style={styles.ctaText}>
              {lang === 'mr' ? '📞 किसान कॉल सेंटर' : '📞 Kisan Call Centre'}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.section}>
          {lang === 'mr' ? 'सामान्य लक्षणे व उपाय' : 'Common symptoms & fixes'}
        </Text>
        {tips.map((tip, i) => (
          <View key={i} style={styles.tip}>
            <Text style={styles.tipTitle}>{tip.title}</Text>
            <Text style={styles.tipBody}>{tip.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm, gap: 4 },
  back: { color: colors.primary, fontSize: font.md, fontWeight: '700' },
  title: { fontSize: font.xxl, fontWeight: '800', color: colors.text },
  hero: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.xl,
    marginBottom: spacing.lg,
  },
  heroTitle: { fontSize: font.lg, fontWeight: '800', color: colors.text, marginTop: spacing.md, textAlign: 'center' },
  heroBody: { fontSize: font.sm, color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center', lineHeight: 20 },
  cta: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: font.md },
  section: {
    fontSize: font.sm, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  tip: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    ...shadow.soft,
  },
  tipTitle: { fontSize: font.md, fontWeight: '700', color: colors.text },
  tipBody: { fontSize: font.sm, color: colors.textMuted, marginTop: 2, lineHeight: 20 },
});
