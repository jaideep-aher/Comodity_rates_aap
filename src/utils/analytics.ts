// PostHog + Sentry for product analytics; Firebase is used only for Crashlytics (crashes).
// Optional SDKs: missing config or native module → no-ops.

import Constants from 'expo-constants';

type Props = Record<string, unknown>;

let inited = false;
let posthog: any = null;
let sentry: any = null;
let consentGiven = true;
/** null = not probed; false = native module missing; true = ok */
let crashlyticsNativeOk: boolean | null = null;

function cfg(key: string): string | undefined {
  const extra = (Constants.expoConfig?.extra ?? (Constants as any).manifest?.extra ?? {}) as Record<string, any>;
  const fromExtra = extra[key];
  if (fromExtra) return String(fromExtra);
  const envKey = 'EXPO_PUBLIC_' + key.replace(/([A-Z])/g, '_$1').toUpperCase();
  const fromEnv = (process.env as any)[envKey];
  return fromEnv || undefined;
}

export function setConsent(optIn: boolean) {
  consentGiven = optIn;
  if (posthog) {
    try {
      if (optIn) posthog.optIn?.();
      else posthog.optOut?.();
    } catch { /* ignore */ }
  }
}

async function tryInitFirebaseCrashlytics() {
  if (crashlyticsNativeOk !== null) return;
  try {
    const crashMod: any = await import('@react-native-firebase/crashlytics');
    await crashMod.default().setCrashlyticsCollectionEnabled(true);
    crashlyticsNativeOk = true;
  } catch {
    crashlyticsNativeOk = false;
  }
}

export async function initAnalytics() {
  if (inited) return;
  inited = true;

  void tryInitFirebaseCrashlytics();

  const sentryDsn = cfg('sentryDsn');
  if (sentryDsn) {
    try {
      const mod: any = await import('sentry-expo').catch(() => import('@sentry/react-native'));
      if (mod?.init) {
        mod.init({ dsn: sentryDsn, enableInExpoDevelopment: false, debug: false });
        sentry = mod;
      }
    } catch {
      // optional
    }
  }

  const posthogKey = cfg('posthogApiKey');
  if (posthogKey) {
    try {
      const mod: any = await import('posthog-react-native');
      const Client = mod.PostHog ?? mod.default;
      posthog = new Client(posthogKey, {
        host: cfg('posthogHost') || 'https://app.posthog.com',
      });
    } catch {
      // optional
    }
  }
}

export function track(event: string, props: Props = {}) {
  if (!consentGiven || !posthog) return;
  try {
    posthog.capture(event, props);
  } catch { /* ignore */ }
}

/** Screen / route changes — PostHog only (Firebase Analytics is not used). */
export function logNavigationScreen(screenName: string, routeParams: Props = {}) {
  if (!consentGiven || !posthog) return;
  const name = (screenName || 'unknown').slice(0, 100);
  try {
    posthog.capture('screen_view', { screen: name, ...routeParams });
  } catch { /* ignore */ }
}

export function identify(userId: string, traits: Props = {}) {
  if (consentGiven && posthog) {
    try {
      posthog.identify(userId, traits);
    } catch { /* ignore */ }
  }
  void (async () => {
    try {
      await tryInitFirebaseCrashlytics();
      if (!crashlyticsNativeOk) return;
      const crashMod: any = await import('@react-native-firebase/crashlytics');
      await crashMod.default().setUserId(userId);
    } catch { /* optional */ }
  })();
}

export function captureException(err: unknown, context?: Props) {
  try {
    if (sentry?.Native?.captureException) sentry.Native.captureException(err, { extra: context });
    else if (sentry?.captureException) sentry.captureException(err, { extra: context });
    else if (__DEV__) console.warn('captureException:', err, context);
  } catch { /* ignore */ }
  void (async () => {
    try {
      await tryInitFirebaseCrashlytics();
      if (!crashlyticsNativeOk) return;
      const crashMod: any = await import('@react-native-firebase/crashlytics');
      const e = err instanceof Error ? err : new Error(String(err));
      await crashMod.default().recordError(e);
    } catch { /* optional */ }
  })();
}
