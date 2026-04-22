import { API_URL } from './config';

export type ClientConfigResponse = {
  minAppVersion: string | null;
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
  return (await res.json()) as ClientConfigResponse;
}
