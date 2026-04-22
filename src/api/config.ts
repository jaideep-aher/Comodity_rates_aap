import Constants from 'expo-constants';

type ApiMode = 'mock' | 'real';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

export const API_MODE: ApiMode =
  (process.env.EXPO_PUBLIC_API_MODE as ApiMode | undefined) ??
  (extra.apiMode as ApiMode | undefined) ??
  'mock';

export const API_URL: string =
  process.env.EXPO_PUBLIC_API_URL ??
  extra.apiUrl ??
  'http://localhost:4000';

export const IS_REAL = API_MODE === 'real';
