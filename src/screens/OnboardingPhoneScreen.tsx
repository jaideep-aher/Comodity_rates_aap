import React, { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, font, radius, spacing } from '../theme';
import { useDict, useSettings } from '../store/settingsStore';
import { useAuth } from '../auth/authStore';

type Props = {
  onCodeSent: (phone: string, devCode?: string) => void;
};

export function OnboardingPhoneScreen({ onCodeSent }: Props) {
  const t = useDict();
  const lang = useSettings((s) => s.language);
  const sendOtp = useAuth((s) => s.sendOtp);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    Keyboard.dismiss();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setErr(lang === 'mr' ? '१० अंकी मोबाइल क्रमांक टाका' : 'Enter a valid 10-digit mobile number');
      return;
    }
    setErr(null);
    setLoading(true);
    try {
      const res = await sendOtp('+91' + digits);
      onCodeSent('+91' + digits, res.devCode);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.wrap}>
      <View style={styles.hero}>
        <Text style={styles.icon}>📱</Text>
        <Text style={styles.title}>
          {lang === 'mr' ? 'मोबाइल क्रमांक' : 'Phone number'}
        </Text>
        <Text style={styles.sub}>
          {lang === 'mr'
            ? 'आम्ही तुम्हाला OTP पाठवू.'
            : "We'll send you a one-time code."}
        </Text>
      </View>

      <View style={styles.body}>
        <View style={styles.inputRow}>
          <Text style={styles.cc}>+91</Text>
          <TextInput
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={setPhone}
            placeholder="98XXXXXXXX"
            placeholderTextColor={colors.textSubtle}
            style={styles.input}
            autoFocus
          />
        </View>
        {err && <Text style={styles.err}>{err}</Text>}
      </View>

      <Pressable
        style={[styles.cta, (loading || phone.length < 10) && { opacity: 0.5 }]}
        onPress={submit}
        disabled={loading || phone.length < 10}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.ctaText}>{t.continue}</Text>
        )}
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  hero: { alignItems: 'center', paddingTop: spacing.xxl, paddingBottom: spacing.xl },
  icon: { fontSize: 56 },
  title: { fontSize: font.xxl, fontWeight: '800', color: colors.text, marginTop: spacing.md },
  sub: { fontSize: font.md, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' },
  body: { flex: 1 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  cc: { fontSize: font.xl, fontWeight: '700', color: colors.text, marginRight: spacing.sm },
  input: { flex: 1, fontSize: font.xl, paddingVertical: spacing.md, color: colors.text },
  err: { color: colors.danger, marginTop: spacing.sm, fontSize: font.sm },
  cta: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontSize: font.lg, fontWeight: '700' },
});
