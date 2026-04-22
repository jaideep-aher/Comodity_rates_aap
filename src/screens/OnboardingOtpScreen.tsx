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
import { useAuth } from '../auth/authStore';

type Props = {
  phone: string;
  devCode?: string;
  onVerified: (isNew: boolean) => void;
  onBack: () => void;
};

export function OnboardingOtpScreen({ phone, devCode, onVerified, onBack }: Props) {
  const t = useDict();
  const lang = useSettings((s) => s.language);
  const verifyOtp = useAuth((s) => s.verifyOtp);
  const sendOtp = useAuth((s) => s.sendOtp);
  const [code, setCode] = useState(devCode ?? '');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(30);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const submit = async () => {
    Keyboard.dismiss();
    if (code.length < 4) {
      setErr(lang === 'mr' ? 'कोड टाका' : 'Enter the code');
      return;
    }
    setErr(null);
    setLoading(true);
    try {
      const res = await verifyOtp(phone, code);
      onVerified(res.isNew);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (resendIn > 0) return;
    try {
      await sendOtp(phone);
      setResendIn(30);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <SafeAreaView style={styles.wrap}>
      <Pressable onPress={onBack} hitSlop={10} style={styles.back}>
        <Text style={styles.backText}>‹ {t.back}</Text>
      </Pressable>

      <View style={styles.hero}>
        <Text style={styles.icon}>🔐</Text>
        <Text style={styles.title}>{lang === 'mr' ? 'OTP टाका' : 'Enter OTP'}</Text>
        <Text style={styles.sub}>
          {lang === 'mr' ? 'पाठवलेला कोड ' + phone : 'Code sent to ' + phone}
        </Text>
        {devCode && (
          <View style={styles.devHint}>
            <Text style={styles.devHintText}>
              {lang === 'mr' ? 'डेव्ह मोड: ' : 'Dev mode: '}{devCode}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <TextInput
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={setCode}
          placeholder="000000"
          placeholderTextColor={colors.textSubtle}
          style={styles.input}
          autoFocus
        />
        {err && <Text style={styles.err}>{err}</Text>}

        <Pressable onPress={resend} disabled={resendIn > 0}>
          <Text style={[styles.resend, resendIn > 0 && { opacity: 0.4 }]}>
            {resendIn > 0
              ? (lang === 'mr' ? `पुन्हा पाठवा (${resendIn}s)` : `Resend (${resendIn}s)`)
              : (lang === 'mr' ? 'पुन्हा पाठवा' : 'Resend code')}
          </Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.cta, (loading || code.length < 4) && { opacity: 0.5 }]}
        onPress={submit}
        disabled={loading || code.length < 4}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>{t.continue}</Text>}
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  back: { paddingVertical: spacing.sm },
  backText: { fontSize: font.md, color: colors.primary, fontWeight: '600' },
  hero: { alignItems: 'center', paddingTop: spacing.xl, paddingBottom: spacing.xl },
  icon: { fontSize: 56 },
  title: { fontSize: font.xxl, fontWeight: '800', color: colors.text, marginTop: spacing.md },
  sub: { fontSize: font.md, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' },
  devHint: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: radius.pill,
  },
  devHintText: { fontSize: font.sm, color: '#92400E', fontWeight: '600' },
  body: { flex: 1, alignItems: 'center' },
  input: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    fontSize: font.display,
    fontWeight: '700',
    letterSpacing: 8,
    textAlign: 'center',
    color: colors.text,
  },
  err: { color: colors.danger, marginTop: spacing.sm, fontSize: font.sm },
  resend: { marginTop: spacing.xl, fontSize: font.md, color: colors.primary, fontWeight: '600' },
  cta: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontSize: font.lg, fontWeight: '700' },
});
