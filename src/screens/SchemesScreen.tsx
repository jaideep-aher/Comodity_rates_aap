import React, { useState } from 'react';
import { FlatList, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, font, radius, shadow, spacing } from '../theme';
import { SCHEMES, type Scheme } from '../data/schemes';
import { useDict, useSettings } from '../store/settingsStore';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

type Props = { onBack: () => void };

export function SchemesScreen({ onBack }: Props) {
  const t = useDict();
  const lang = useSettings((s) => s.language);
  const [open, setOpen] = useState<Scheme | null>(null);

  return (
    <SafeAreaView style={styles.wrap} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={16}>
          <Text style={styles.back}>‹ {t.back}</Text>
        </Pressable>
        <Text style={styles.title}>{t.schemesTitle}</Text>
      </View>
      <FlatList
        data={SCHEMES}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => setOpen(item)}>
            <View style={[styles.icon, { backgroundColor: item.color + '22' }]}>
              <SchemeGlyph kind={item.iconKey} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.schemeTitle}>{item.title[lang]}</Text>
              <Text style={styles.short}>{item.short[lang]}</Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </Pressable>
        )}
      />

      <Modal visible={!!open} animationType="slide" onRequestClose={() => setOpen(null)}>
        {open && (
          <SafeAreaView style={styles.wrap}>
            <View style={styles.header}>
              <Pressable onPress={() => setOpen(null)} hitSlop={16}>
                <Text style={styles.back}>‹ {t.back}</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
              <View style={[styles.hero, { backgroundColor: open.color + '14' }]}>
                <View style={[styles.icon, { backgroundColor: open.color + '22', width: 64, height: 64 }]}>
                  <SchemeGlyph kind={open.iconKey} color={open.color} size={36} />
                </View>
                <Text style={styles.detailTitle}>{open.title[lang]}</Text>
                <Text style={styles.detailShort}>{open.short[lang]}</Text>
              </View>

              <DetailBlock label={t.schemesBenefit} body={open.benefit[lang]} />
              <DetailBlock label={t.schemesEligibility} body={open.eligibility[lang]} />
              <DetailBlock label={t.schemesHowToApply} body={open.howTo[lang]} />

              <Pressable style={styles.cta} onPress={() => Linking.openURL(open.url)}>
                <Text style={styles.ctaText}>{t.schemesLearnMore}</Text>
              </Pressable>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}

function DetailBlock({ label, body }: { label: string; body: string }) {
  return (
    <View style={styles.block}>
      <Text style={styles.blockLabel}>{label}</Text>
      <Text style={styles.blockBody}>{body}</Text>
    </View>
  );
}

function SchemeGlyph({ kind, color, size = 24 }: { kind: Scheme['iconKey']; color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {kind === 'rupee' && (
        <G stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <Path d="M7 6 L17 6" />
          <Path d="M7 10 L15 10" />
          <Path d="M7 14 L13 14" />
          <Path d="M7 6 Q13 8 13 14 L8 20" />
        </G>
      )}
      {kind === 'seed' && (
        <G fill={color}>
          <Path d="M12 4 Q6 8 6 14 Q6 20 12 20 Q18 20 18 14 Q18 8 12 4 Z" />
          <Path d="M12 7 L12 18" stroke="#fff" strokeWidth="1.5" />
        </G>
      )}
      {kind === 'drop' && (
        <G fill={color}>
          <Path d="M12 3 Q5 12 5 16 Q5 21 12 21 Q19 21 19 16 Q19 12 12 3 Z" />
        </G>
      )}
      {kind === 'shield' && (
        <G stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill={color} fillOpacity="0.2">
          <Path d="M12 3 L20 6 Q20 16 12 21 Q4 16 4 6 Z" />
          <Path d="M9 12 L11 14 L15 10" fill="none" />
        </G>
      )}
      {kind === 'home' && (
        <G stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <Path d="M4 11 L12 4 L20 11 L20 20 L4 20 Z" />
          <Path d="M10 20 L10 14 L14 14 L14 20" />
        </G>
      )}
      {kind === 'truck' && (
        <G stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <Rect x="2" y="7" width="12" height="9" />
          <Path d="M14 10 L18 10 L21 13 L21 16 L14 16" />
          <Circle cx="7" cy="18" r="2" fill={color} />
          <Circle cx="17" cy="18" r="2" fill={color} />
        </G>
      )}
    </Svg>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm, gap: 4 },
  back: { color: colors.primary, fontSize: font.md, fontWeight: '700' },
  title: { fontSize: font.xxl, fontWeight: '800', color: colors.text },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.md,
    ...shadow.soft,
  },
  icon: { width: 48, height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  schemeTitle: { fontSize: font.md, fontWeight: '700', color: colors.text },
  short: { fontSize: font.sm, color: colors.textMuted, marginTop: 2 },
  chev: { fontSize: 28, color: colors.textSubtle, fontWeight: '300' },
  hero: {
    alignItems: 'center', padding: spacing.xl, borderRadius: radius.xl, marginBottom: spacing.lg,
  },
  detailTitle: { fontSize: font.xl, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: spacing.md },
  detailShort: { fontSize: font.md, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  block: {
    backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.lg, marginBottom: spacing.sm,
    ...shadow.soft,
  },
  blockLabel: { fontSize: font.xs, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  blockBody: { fontSize: font.md, color: colors.text, lineHeight: 22 },
  cta: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: font.md },
});
