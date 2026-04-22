import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, font, radius, spacing } from '../theme';
import { useDict } from '../store/settingsStore';

type Props = {
  onUnlock: () => void;
  children?: React.ReactNode;
};

export function PremiumGate({ onUnlock, children }: Props) {
  const t = useDict();
  return (
    <View style={styles.card}>
      <Text style={styles.badge}>★ {t.premiumLocked}</Text>
      {children ?? null}
      <Pressable style={styles.btn} onPress={onUnlock}>
        <Text style={styles.btnText}>{t.premiumUnlock}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary + '40',
    alignItems: 'center',
  },
  badge: {
    color: colors.primaryDark,
    fontWeight: '700',
    fontSize: font.sm,
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    marginTop: spacing.md,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: font.md },
});
