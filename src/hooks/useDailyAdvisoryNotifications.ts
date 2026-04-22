import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWatchlist } from '../store/watchlistStore';
import { useSettings } from '../store/settingsStore';
import { useLocation, activeCoords } from '../store/locationStore';
import { useCropInstances } from '../store/cropInstancesStore';
import { COMMODITIES } from '../data/commodities';
import { getForecast } from '../api/weather';
import { evaluateAllActions } from '../utils/advisor';

// Schedules a single local morning notification (06:30) with the day's
// personalised advisory line. Re-runs daily so the message stays fresh.
// Hides gracefully when expo-notifications isn't bundled.

const LAST_KEY = 'bajarbhav:advisory-notify:lastDay';

async function loadNotifications(): Promise<any | null> {
  try {
    return await import('expo-notifications');
  } catch {
    return null;
  }
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useDailyAdvisoryNotifications() {
  const language = useSettings((s) => s.language);
  const watchIds = useWatchlist((s) => s.ids);
  const villageId = useLocation((s) => s.villageId);
  const gpsLat = useLocation((s) => s.gpsLat);
  const gpsLng = useLocation((s) => s.gpsLng);
  const gpsUpdatedAt = useLocation((s) => s.gpsUpdatedAt);
  const instances = useCropInstances((s) => s.byId);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const Notifications = await loadNotifications();
      if (!Notifications) return;

      try {
        const perm = await Notifications.getPermissionsAsync();
        let status = perm.status;
        if (status !== 'granted') {
          const req = await Notifications.requestPermissionsAsync();
          status = req.status;
        }
        if (status !== 'granted') return;

        const last = await AsyncStorage.getItem(LAST_KEY);
        if (last === todayIso()) return;

        const { lat, lng } = activeCoords({ villageId, gpsLat, gpsLng, gpsUpdatedAt });
        const forecast = await getForecast(lat, lng);
        if (cancelled || forecast.days.length === 0) return;

        const [today, ...rest] = forecast.days;
        const primaryIcon =
          watchIds
            .map((id) => COMMODITIES.find((c) => c.id === id))
            .filter(Boolean)
            .map((c) => c!.iconKey)[0] ?? null;
        const actions = evaluateAllActions(today, rest, primaryIcon);
        const avoid = actions.find((a) => a.verdict === 'avoid');
        const warn = actions.find((a) => a.verdict === 'warn');
        const hero = avoid ?? warn ?? actions[0];

        const title =
          language === 'mr'
            ? `🌾 सकाळची सल्ला — ${today.label.mr}`
            : `🌾 Morning advisory — ${today.label.en}`;
        const body =
          `${hero.emoji} ${hero.title[language]}: ${hero.reason[language]}\n` +
          `${today.advice[language]}`;

        await Notifications.cancelAllScheduledNotificationsAsync();

        // Schedule for tomorrow at 06:30 local.
        const trigger = new Date();
        trigger.setDate(trigger.getDate() + 1);
        trigger.setHours(6, 30, 0, 0);

        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data: { kind: 'daily-advisory' },
          },
          trigger: { date: trigger },
        });

        await AsyncStorage.setItem(LAST_KEY, todayIso());
      } catch {
        // Notifications not available or permission denied — skip.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [language, watchIds, villageId, gpsLat, gpsLng, gpsUpdatedAt, instances]);
}
