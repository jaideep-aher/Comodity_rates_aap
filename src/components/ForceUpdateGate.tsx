import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchClientConfig } from '../api/clientConfig';
import { API_URL, IS_REAL } from '../api/config';
import { colors, font } from '../theme';
import { isVersionOlderThan } from '../utils/compareVersion';

type Phase = 'checking' | 'ok' | 'blocked';

function currentAppVersion(): string {
  return Constants.expoConfig?.version ?? '0.0.0';
}

function ForceUpdateScreen(props: {
  minVersion: string;
  currentVersion: string;
  storeUrl: string;
}) {
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const openStore = () => {
    Linking.openURL(props.storeUrl).catch(() => {});
  };

  return (
    <Modal
      visible
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={() => {}}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.forceRoot} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.forceInner}>
          <Text style={styles.forceEmoji} accessibilityLabel="">
            📲
          </Text>
          <Text style={styles.forceTitleMr}>अॅप अपडेट आवश्यक</Text>
          <Text style={styles.forceTitleEn}>Update required</Text>
          <Text style={styles.forceBody}>
            या आवृत्तीवर (v{props.currentVersion}) अॅप वापरता येणार नाही. कृपया नवीन आवृत्ती (v
            {props.minVersion}+) इन्स्टॉल करा.
          </Text>
          <Text style={styles.forceBodyEn}>
            This version (v{props.currentVersion}) is no longer supported. Install v{props.minVersion}{' '}
            or newer from the store.
          </Text>
          <Pressable
            onPress={openStore}
            style={({ pressed }) => [styles.forceBtn, pressed && styles.forceBtnPressed]}
            accessibilityRole="button"
          >
            <Text style={styles.forceBtnText}>
              {Platform.OS === 'ios' ? 'App Store मध्ये उघडा' : 'Play Store मध्ये उघडा'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function CheckingScreen() {
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaView style={styles.checkRoot} edges={['top', 'bottom', 'left', 'right']}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.checkText}>तपासत आहे…</Text>
      <Text style={styles.checkSub}>{API_URL.replace(/^https?:\/\//, '')}</Text>
    </SafeAreaView>
  );
}

export function ForceUpdateGate({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>(() => (IS_REAL ? 'checking' : 'ok'));
  const [block, setBlock] = useState<{ min: string; storeUrl: string } | null>(null);

  useEffect(() => {
    if (!IS_REAL) return;

    let cancelled = false;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12_000);

    (async () => {
      try {
        const cfg = await fetchClientConfig(ctrl.signal);
        clearTimeout(t);
        if (cancelled) return;

        const min = cfg.minAppVersion?.trim();
        const cur = currentAppVersion();
        if (!min) {
          setPhase('ok');
          return;
        }

        const storeUrl =
          Platform.OS === 'ios'
            ? cfg.iosStoreUrl || cfg.androidStoreUrl
            : cfg.androidStoreUrl || cfg.iosStoreUrl;

        if (!storeUrl) {
          setPhase('ok');
          return;
        }

        if (isVersionOlderThan(cur, min)) {
          setBlock({ min, storeUrl });
          setPhase('blocked');
          return;
        }
        setPhase('ok');
      } catch {
        clearTimeout(t);
        if (!cancelled) setPhase('ok');
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(t);
      ctrl.abort();
    };
  }, []);

  if (phase === 'checking') {
    return <CheckingScreen />;
  }

  if (phase === 'blocked' && block) {
    return (
      <ForceUpdateScreen
        minVersion={block.min}
        currentVersion={currentAppVersion()}
        storeUrl={block.storeUrl}
      />
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  checkRoot: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  checkText: {
    marginTop: 8,
    fontSize: font.md,
    fontWeight: '600',
    color: colors.text,
  },
  checkSub: {
    fontSize: font.sm,
    color: colors.textMuted,
  },
  forceRoot: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  forceInner: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
  },
  forceEmoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 16,
  },
  forceTitleMr: {
    fontSize: font.xl,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  forceTitleEn: {
    fontSize: font.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 20,
  },
  forceBody: {
    fontSize: font.md,
    lineHeight: 24,
    color: colors.text,
    marginBottom: 12,
  },
  forceBodyEn: {
    fontSize: font.sm,
    lineHeight: 22,
    color: colors.textMuted,
    marginBottom: 28,
  },
  forceBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  forceBtnPressed: {
    opacity: 0.9,
  },
  forceBtnText: {
    fontSize: font.md,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
