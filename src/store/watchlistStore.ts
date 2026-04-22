import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Alert } from '../types';
import {
  pushWatchlistBulk,
  pushWatchlistItem,
  removeWatchlistItem,
} from '../api/client';

function syncBulk(ids: number[]) {
  pushWatchlistBulk(ids).catch(() => {});
}
function syncAdd(id: number, alert?: Alert) {
  pushWatchlistItem(id, alert?.min ?? null, alert?.max ?? null).catch(() => {});
}
function syncRemove(id: number) {
  removeWatchlistItem(id).catch(() => {});
}

type WatchlistState = {
  ids: number[];
  alerts: Record<number, Alert>;
  toggle: (id: number) => void;
  add: (id: number) => void;
  remove: (id: number) => void;
  setAll: (ids: number[]) => void;
  has: (id: number) => boolean;
  setAlert: (id: number, min: number | null, max: number | null) => void;
  clearAlert: (id: number) => void;
};

export const useWatchlist = create<WatchlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      alerts: {},
      toggle: (id) => {
        const cur = get().ids;
        const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
        set({ ids: next });
        if (cur.includes(id)) syncRemove(id);
        else syncAdd(id, get().alerts[id]);
      },
      add: (id) => {
        const cur = get().ids;
        if (!cur.includes(id)) {
          set({ ids: [...cur, id] });
          syncAdd(id, get().alerts[id]);
        }
      },
      remove: (id) => {
        set({ ids: get().ids.filter((x) => x !== id) });
        syncRemove(id);
      },
      setAll: (ids) => {
        set({ ids });
        syncBulk(ids);
      },
      has: (id) => get().ids.includes(id),
      setAlert: (id, min, max) => {
        set({
          alerts: { ...get().alerts, [id]: { commodityId: id, min, max } },
        });
        if (get().ids.includes(id)) syncAdd(id, { commodityId: id, min, max });
      },
      clearAlert: (id) => {
        const next = { ...get().alerts };
        delete next[id];
        set({ alerts: next });
        if (get().ids.includes(id)) syncAdd(id);
      },
    }),
    {
      name: 'bajarbhav:watchlist',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
