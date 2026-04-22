import React, { useEffect, useState } from 'react';
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
import { useClientConfigStore } from '../store/clientConfigStore';
import { useAuth } from '../auth/authStore';

type Props = {
  onCodeSent: (phone: string, devCode?: string) => void;
  /** When the server has OTP disabled, called after phone login succeeds without an OTP step. */
  onAuthWithoutOtp: () => void;
};

export function OnboardingPhoneScreen({ onCodeSent, onAuthWithoutOtp }: Props) {
  const t = useDict();
  const lang = useSettings((s) => s.language);
  const sendOtp = useAuth((s) => s.sendOtp);
  const verifyOtp = useAuth((s) => s.verifyOtp);
  const otpVerificationEnabled = useClientConfigStore((s) => s.otpVerificationEnabled);
  const configLoaded = useClientConfigStore((s) => s.loaded);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void useClientConfigStore.getState().ensureLoaded();
  }, []);

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
      await useClientConfigStore.getState().ensureLoaded();
      const phoneE164 = '+91' + digits;
      if (!useClientConfigStore.getState().otpVerificationEnabled) {
        await verifyOtp(phoneE164, '');
        onAuthWithoutOtp();
        return;
      }
      const res = await sendOtp(phoneE164);
      onCodeSent(phoneE164, res.devCode);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const sub =
    !configLoaded
      ? lang === 'mr'
        ? 'तुमचा १० अंकी मोबाइल क्रमांक टाका.'
        : 'Enter your 10-digit mobile number.'
      : otpVerificationEnabled
        ? lang === 'mr'
          ? 'आम्ही तुम्हाला OTP पाठवू.'
          : "We'll send you a one-time code."
        : lang === 'mr'
          ? 'फक्त साइन-इनसाठी तुमचा क्रमांक जतन करू; OTP नाही.'
          : 'We only save your number to sign you in — no OTP.';

  return (
    <SafeAreaView style={styles.wrap}>
      <View style={styles.hero}>
        <Text style={styles.icon}>📱</Text>
        <Text style={styles.title}>
          {lang === 'mr' ? 'मोबाइल क्रमांक' : 'Phone number'}
        </Text>
        <Text style={styles.sub}>{sub}</Text>
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
