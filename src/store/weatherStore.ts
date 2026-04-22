import { create } from 'zustand';
import type { WeatherDay } from '../data/weather';
import { getForecast, type ForecastResult } from '../api/weather';

// Shared weather cache so every component (WeatherCard, FarmActionsStrip,
// RainRadarStrip, advisory scheduler, Ask-Advisor) sees the same snapshot.

type State = {
  days: WeatherDay[];
  source: ForecastResult['source'];
  loading: boolean;
  fetchedAt: number | null;
  fetchedFor: string | null; // "lat,lng" key
  refresh: (lat: number, lng: number, opts?: { force?: boolean }) => Promise<void>;
};

export const useWeather = create<State>((set, get) => ({
  days: [],
  source: 'mock',
  loading: false,
  fetchedAt: null,
  fetchedFor: null,
  refresh: async (lat, lng, opts) => {
    const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
    const st = get();
    const fresh =
      !opts?.force &&
      st.fetchedFor === key &&
      st.fetchedAt != null &&
      Date.now() - st.fetchedAt < 10 * 60_000;
    if (fresh) return;
    set({ loading: true });
    const res = await getForecast(lat, lng);
    set({
      days: res.days,
      source: res.source,
      fetchedAt: res.fetchedAt,
      fetchedFor: key,
      loading: false,
    });
  },
}));
