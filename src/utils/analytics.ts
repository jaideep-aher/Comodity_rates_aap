// Thin wrapper around PostHog + Sentry. Both are optional: if the SDK or the
// configuration is missing the calls are no-ops. This lets us sprinkle
// `track('x')` anywhere without worrying about setup.

import Constants from 'expo-constants';

type Props = Record<string, unknown>;

let inited = false;
let posthog: any = null;
let sentry: any = null;
let consentGiven = true;

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

export async function initAnalytics() {
  if (inited) return;
  inited = true;

  const sentryDsn = cfg('sentryDsn');
  if (sentryDsn) {
    try {
      // sentry-expo / @sentry/react-native
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
  try { posthog.capture(event, props); } catch { /* ignore */ }
}

export function identify(userId: string, traits: Props = {}) {
  if (!consentGiven || !posthog) return;
  try { posthog.identify(userId, traits); } catch { /* ignore */ }
}

export function captureException(err: unknown, context?: Props) {
  try {
    if (sentry?.Native?.captureException) sentry.Native.captureException(err, { extra: context });
    else if (sentry?.captureException) sentry.captureException(err, { extra: context });
    else if (__DEV__) console.warn('captureException:', err, context);
  } catch { /* ignore */ }
}
