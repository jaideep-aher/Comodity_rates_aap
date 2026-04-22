import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { API_URL, IS_REAL } from '../api/config';

export type AuthUser = {
  id: string;
  phone: string;
  name: string | null;
  village: string | null;
  district: string | null;
  language: 'mr' | 'en';
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  sendOtp: (phone: string) => Promise<{ devCode?: string }>;
  verifyOtp: (phone: string, code: string) => Promise<{ isNew: boolean }>;
  logout: () => void;
  setUser: (u: AuthUser) => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      sendOtp: async (phone) => {
        if (!IS_REAL) {
          return { devCode: '000000' };
        }
        const res = await fetch(`${API_URL}/api/auth/otp/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? 'Failed to send OTP');
        return { devCode: data.devCode };
      },

      verifyOtp: async (phone, code) => {
        if (!IS_REAL) {
          const fakeUser: AuthUser = {
            id: 'local-' + phone,
            phone,
            name: null,
            village: null,
            district: null,
            language: 'mr',
          };
          set({ token: 'mock-token', user: fakeUser, isAuthenticated: true });
          return { isNew: true };
        }
        const res = await fetch(`${API_URL}/api/auth/otp/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, code }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? 'Verification failed');
        set({ token: data.token, user: data.user, isAuthenticated: true });
        return { isNew: !!data.isNew };
      },

      logout: () => set({ token: null, user: null, isAuthenticated: false }),
      setUser: (u) => set({ user: u }),
    }),
    {
      name: 'bajarbhav:auth',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
