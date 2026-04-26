import React, { useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, font, radius, shadow, spacing } from '../theme';
import { useSettings, useDict } from '../store/settingsStore';
import { useWatchlist } from '../store/watchlistStore';
import { usePremium } from '../store/premiumStore';
import { useAuth } from '../auth/authStore';
import { IS_REAL } from '../api/config';
import type { Language } from '../types';
import { useLocation, activeVillage } from '../store/locationStore';
import { VillagePickerModal } from '../components/VillagePickerModal';

type Props = {
  onEditCrops: () => void;
  onOpenPremium: () => void;
};

export function ProfileScreen({ onEditCrops, onOpenPremium }: Props) {
  const t = useDict();
  const premium = usePremium();
  const isPremium = premium.isActive();
  const logout = useAuth((s) => s.logout);
  const language = useSettings((s) => s.language);
  const setLanguage = useSettings((s) => s.setLanguage);
  const unit = useSettings((s) => s.unit);
  const setUnit = useSettings((s) => s.setUnit);
  const numerals = useSettings((s) => s.numerals);
  const setNumerals = useSettings((s) => s.setNumerals);
  const name = useSettings((s) => s.name);
  const setName = useSettings((s) => s.setName);
  const village = useSettings((s) => s.village);
  const setVillage = useSettings((s) => s.setVillage);
  const watchCount = useWatchlist((s) => s.ids.length);
  const villageId = useLocation((s) => s.villageId);
  const activeV = activeVillage({ villageId });
  const [villagePickerOpen, setVillagePickerOpen] = useState(false);

  return (
    <SafeAreaView style={styles.wrap} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.profileTitle}</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>{t.profileName}</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t.profileName}
              placeholderTextColor={colors.textSubtle}
              style={styles.input}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>{t.profileVillage}</Text>
            <TextInput
              value={village}
              onChangeText={setVillage}
              placeholder={t.profileVillage}
              placeholderTextColor={colors.textSubtle}
              style={styles.input}
            />
          </View>
          <Pressable
            onPress={() => setVillagePickerOpen(true)}
            style={styles.villageBtn}
          >
            <Text style={styles.villageBtnText}>
              📍  {activeV.name[language]} · {activeV.pincode}
            </Text>
            <Text style={styles.villageBtnSub}>{t.villagePickerChange}</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>{t.profileLanguage}</Text>
        <View style={styles.card}>
          <Toggle
            options={[
              { key: 'mr' as Language, label: 'मराठी' },
              { key: 'en' as Language, label: 'English' },
            ]}
            value={language}
            onChange={setLanguage}
          />
        </View>

        <Text style={styles.sectionLabel}>{t.profileUnitToggle}</Text>
        <View style={styles.card}>
          <Toggle
            options={[
              { key: 'qtl' as const, label: t.profileUnitPerQtl },
              { key: 'kg' as const, label: t.profileUnitPerKg },
            ]}
            value={unit}
            onChange={setUnit}
          />
        </View>

        <Text style={styles.sectionLabel}>{t.profileNumeralsToggle}</Text>
        <View style={styles.card}>
          <Toggle
            options={[
              { key: 'deva' as const, label: t.profileNumeralsDeva },
              { key: 'latin' as const, label: t.profileNumeralsLatin },
            ]}
            value={numerals === 'auto' ? (language === 'mr' ? 'deva' : 'latin') : numerals}
            onChange={setNumerals}
          />
        </View>

        <Pressable style={styles.cropsRow} onPress={onEditCrops}>
          <Text style={styles.cropsIcon}>🌱</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cropsTitle}>
              {language === 'mr' ? 'माझी पिके' : 'My crops'}
            </Text>
            <Text style={styles.cropsSub}>
              {watchCount}{' '}
              {language === 'mr' ? 'पिके निवडली' : 'crops selected'}
            </Text>
          </View>
          <Text style={styles.chev}>›</Text>
        </Pressable>

        <Pressable style={styles.cropsRow} onPress={onOpenPremium}>
          <Text style={styles.cropsIcon}>★</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cropsTitle}>
              {isPremium ? t.premiumActive : t.premiumTitle}
            </Text>
            <Text style={styles.cropsSub}>
              {isPremium && premium.sub.currentPeriodEnd
                ? `${t.premiumExpires} ${new Date(premium.sub.currentPeriodEnd).toLocaleDateString()}`
                : t.premiumTagline}
            </Text>
          </View>
          <Text style={styles.chev}>›</Text>
        </Pressable>

        <Pressable
          style={styles.cropsRow}
          onPress={() =>
            Share.share({ message: t.referMessage('https://bajarbhav.app') })
          }
        >
          <Text style={styles.cropsIcon}>📣</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cropsTitle}>{t.shareWithFriends}</Text>
            <Text style={styles.cropsSub}>{t.referCta}</Text>
          </View>
          <Text style={styles.chev}>›</Text>
        </Pressable>

        {IS_REAL && (
          <Pressable
            style={[styles.cropsRow, { marginBottom: spacing.lg }]}
            onPress={logout}
          >
            <Text style={styles.cropsIcon}>⎋</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cropsTitle}>{t.profileLogout}</Text>
            </View>
          </Pressable>
        )}

        {!IS_REAL && (
          <View style={styles.mockNotice}>
            <Text style={styles.mockTitle}>
              {language === 'mr' ? 'डेमो मोड' : 'Demo mode'}
            </Text>
            <Text style={styles.mockBody}>{t.profileMockBanner}</Text>
          </View>
        )}

        <Text style={styles.meta}>{t.profileSource}</Text>
        <Text style={styles.meta}>{t.profileVersion}</Text>
      </ScrollView>
      <VillagePickerModal
        visible={villagePickerOpen}
        onClose={() => setVillagePickerOpen(false)}
      />
    </SafeAreaView>
  );
}

function Toggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.toggleWrap}>
      {options.map((o) => {
        const active = value === o.key;
        return (
          <Pressable
            key={o.key}
            style={[styles.toggleOpt, active && styles.toggleOptActive]}
            onPress={() => onChange(o.key)}
          >
            <Text style={[styles.toggleText, active && styles.toggleTextActive]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { fontSize: font.xxl, fontWeight: '800', color: colors.text },
  card: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.card,
  },
  field: { marginBottom: spacing.md },
  label: { fontSize: font.xs, color: colors.textMuted, marginBottom: 4 },
  input: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontSize: font.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionLabel: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontSize: font.sm,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  toggleWrap: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: 4,
  },
  toggleOpt: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  toggleOptActive: { backgroundColor: colors.primary },
  toggleText: { fontSize: font.sm, fontWeight: '600', color: colors.text },
  toggleTextActive: { color: '#fff' },
  cropsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadow.card,
  },
  cropsIcon: { fontSize: 32 },
  cropsTitle: { fontSize: font.md, fontWeight: '700', color: colors.text },
  cropsSub: { fontSize: font.sm, color: colors.textMuted, marginTop: 2 },
  chev: { fontSize: 28, color: colors.textSubtle, fontWeight: '300' },
  mockNotice: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: '#FEF3C7',
    borderRadius: radius.md,
  },
  mockTitle: { fontSize: font.sm, fontWeight: '700', color: '#92400E' },
  mockBody: { fontSize: font.xs, color: '#92400E', marginTop: 2 },
  villageBtn: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  villageBtnText: { fontSize: font.md, color: colors.primaryDark, fontWeight: '800' },
  villageBtnSub: { fontSize: font.xs, color: colors.primaryDark, marginTop: 2 },
  meta: {
    textAlign: 'center',
    fontSize: font.xs,
    color: colors.textSubtle,
    marginTop: spacing.md,
  },
});
