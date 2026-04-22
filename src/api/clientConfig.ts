import { API_URL } from './config';

export type ClientConfigResponse = {
  minAppVersion: string | null;
  maxAppVersion: string | null;
  otpVerificationEnabled: boolean;
  androidStoreUrl: string | null;
  iosStoreUrl: string | null;
};

export async function fetchClientConfig(signal?: AbortSignal): Promise<ClientConfigResponse> {
  const res = await fetch(`${API_URL}/api/client-config`, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`client-config ${res.status}`);
  }
  const data = (await res.json()) as Partial<ClientConfigResponse>;
  return {
    minAppVersion: data.minAppVersion ?? null,
    maxAppVersion: data.maxAppVersion ?? null,
    otpVerificationEnabled: data.otpVerificationEnabled !== false,
    androidStoreUrl: data.androidStoreUrl ?? null,
    iosStoreUrl: data.iosStoreUrl ?? null,
  };
}
