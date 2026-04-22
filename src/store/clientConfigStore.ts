import { create } from 'zustand';
import { fetchClientConfig, type ClientConfigResponse } from '../api/clientConfig';

type State = {
  minAppVersion: string | null;
  maxAppVersion: string | null;
  otpVerificationEnabled: boolean;
  androidStoreUrl: string | null;
  iosStoreUrl: string | null;
  loaded: boolean;
  applyFromResponse: (cfg: ClientConfigResponse) => void;
  ensureLoaded: () => Promise<void>;
};

export const useClientConfigStore = create<State>((set, get) => ({
  minAppVersion: null,
  maxAppVersion: null,
  otpVerificationEnabled: true,
  androidStoreUrl: null,
  iosStoreUrl: null,
  loaded: false,
  applyFromResponse: (cfg) =>
    set({
      minAppVersion: cfg.minAppVersion,
      maxAppVersion: cfg.maxAppVersion,
      otpVerificationEnabled: cfg.otpVerificationEnabled !== false,
      androidStoreUrl: cfg.androidStoreUrl,
      iosStoreUrl: cfg.iosStoreUrl,
      loaded: true,
    }),
  ensureLoaded: async () => {
    if (get().loaded) return;
    try {
      const cfg = await fetchClientConfig();
      get().applyFromResponse(cfg);
    } catch {
      set({ loaded: true });
    }
  },
}));
