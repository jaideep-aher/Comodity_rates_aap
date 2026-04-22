import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { VILLAGES, findVillage, type Village } from '../data/villages';
import { syncProfile } from '../api/client';

// The "where am I" source of truth. Persisted across launches so the farmer
// doesn't re-pick their village daily. GPS coords override village lat/lng
// when available (fresher signal), but the village is the anchor for
// human-readable location + pincode.
type State = {
  villageId: string;
  // Most recent GPS fix. Null until the farmer grants permission once.
  gpsLat: number | null;
  gpsLng: number | null;
  gpsUpdatedAt: number | null;

  setVillage: (id: string) => void;
  setGps: (lat: number, lng: number) => void;
  clearGps: () => void;
};

export const useLocation = create<State>()(
  persist(
    (set) => ({
      villageId: 'turbhe',
      gpsLat: null,
      gpsLng: null,
      gpsUpdatedAt: null,
      setVillage: (id) => {
        set({ villageId: id });
        const v = findVillage(id);
        if (v) {
          syncProfile({
            village_id: v.id,
            village: v.name.en,
            district: v.district.en,
            latitude: v.lat,
            longitude: v.lng,
          }).catch(() => {});
        }
      },
      setGps: (lat, lng) => {
        set({ gpsLat: lat, gpsLng: lng, gpsUpdatedAt: Date.now() });
        syncProfile({ latitude: lat, longitude: lng }).catch(() => {});
      },
      clearGps: () => set({ gpsLat: null, gpsLng: null, gpsUpdatedAt: null }),
    }),
    {
      name: 'bajarbhav:location',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export function activeVillage(state: Pick<State, 'villageId'>): Village {
  return findVillage(state.villageId) ?? VILLAGES[0];
}

// Coordinates used by the weather API. Prefers GPS when < 12 h old.
export function activeCoords(
  state: Pick<State, 'villageId' | 'gpsLat' | 'gpsLng' | 'gpsUpdatedAt'>,
): { lat: number; lng: number; source: 'gps' | 'village' } {
  const village = activeVillage(state);
  const fresh =
    state.gpsLat != null &&
    state.gpsLng != null &&
    state.gpsUpdatedAt != null &&
    Date.now() - state.gpsUpdatedAt < 12 * 3_600_000;
  if (fresh && state.gpsLat != null && state.gpsLng != null) {
    return { lat: state.gpsLat, lng: state.gpsLng, source: 'gps' };
  }
  return { lat: village.lat, lng: village.lng, source: 'village' };
}
