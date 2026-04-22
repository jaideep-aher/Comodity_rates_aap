import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '../auth/authStore';
import { registerDeviceToken } from '../api/client';
import { IS_REAL } from '../api/config';

// Registers the device for push notifications as soon as the user is logged in
// (real mode only). Silently no-ops in mock mode or when expo-notifications is
// unavailable. Requires expo-notifications + expo-device at runtime.
export function useNotificationsRegistration() {
  const token = useAuth((s) => s.token);

  useEffect(() => {
    if (!IS_REAL || !token) return;
    let cancelled = false;

    (async () => {
      try {
        const Notifications = await import('expo-notifications');
        const Device = await import('expo-device');

        if (!Device.isDevice) return;

        const settings = await Notifications.getPermissionsAsync();
        let status = settings.status;
        if (status !== 'granted') {
          const req = await Notifications.requestPermissionsAsync();
          status = req.status;
        }
        if (status !== 'granted') return;

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'BajarBhav',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#0B6E4F',
          });
        }

        const tokenRes = await Notifications.getDevicePushTokenAsync();
        const fcmToken = typeof tokenRes.data === 'string' ? tokenRes.data : null;
        if (!fcmToken || cancelled) return;

        await registerDeviceToken(fcmToken).catch(() => {});
      } catch {
        // expo-notifications not installed or unavailable — skip silently.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);
}
