import { useEffect } from 'react';
import { useLocation, activeCoords } from '../store/locationStore';
import { useWeather } from '../store/weatherStore';
import type { WeatherDay } from '../data/weather';

// Fetches weather whenever the active location changes. Returns the live
// forecast + source (open-meteo / backend / mock) so callers can surface it.
export function useLiveWeather(): {
  days: WeatherDay[];
  source: 'open-meteo' | 'backend' | 'mock';
  loading: boolean;
  isLive: boolean;
} {
  const villageId = useLocation((s) => s.villageId);
  const gpsLat = useLocation((s) => s.gpsLat);
  const gpsLng = useLocation((s) => s.gpsLng);
  const gpsUpdatedAt = useLocation((s) => s.gpsUpdatedAt);

  const days = useWeather((s) => s.days);
  const source = useWeather((s) => s.source);
  const loading = useWeather((s) => s.loading);
  const refresh = useWeather((s) => s.refresh);

  useEffect(() => {
    const { lat, lng } = activeCoords({ villageId, gpsLat, gpsLng, gpsUpdatedAt });
    refresh(lat, lng).catch(() => {});
  }, [villageId, gpsLat, gpsLng, gpsUpdatedAt, refresh]);

  return {
    days,
    source,
    loading,
    isLive: source === 'open-meteo' || source === 'backend',
  };
}
