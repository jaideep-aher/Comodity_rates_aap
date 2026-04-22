import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMySubscription } from '../api/premium';
import type { SubscriptionStatus } from '../types';

type PremiumState = {
  sub: SubscriptionStatus;
  lastSyncedAt: number | null;
  isActive: () => boolean;
  refresh: () => Promise<void>;
  setLocal: (sub: SubscriptionStatus) => void;
};

const emptySub: SubscriptionStatus = {
  active: false,
  plan: null,
  status: 'none',
  currentPeriodEnd: null,
};

export const usePremium = create<PremiumState>()(
  persist(
    (set, get) => ({
      sub: emptySub,
      lastSyncedAt: null,
      isActive: () => {
        const { sub } = get();
        if (!sub.active) return false;
        if (!sub.currentPeriodEnd) return sub.active;
        return new Date(sub.currentPeriodEnd).getTime() > Date.now();
      },
      refresh: async () => {
        try {
          const sub = await getMySubscription();
          set({ sub, lastSyncedAt: Date.now() });
        } catch {
          // Offline or unauthenticated — keep cached value.
        }
      },
      setLocal: (sub) => set({ sub, lastSyncedAt: Date.now() }),
    }),
    {
      name: 'premium-v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
