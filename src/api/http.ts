import { API_URL } from './config';
import { useAuth } from '../auth/authStore';

type HttpOpts = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
  query?: Record<string, string | number | undefined>;
};

export class HttpError extends Error {
  constructor(public status: number, public body: any, message: string) {
    super(message);
  }
}

export async function http<T>(path: string, opts: HttpOpts = {}): Promise<T> {
  const method = opts.method ?? 'GET';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (opts.auth !== false) {
    const token = useAuth.getState().token;
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const qs = opts.query
    ? '?' +
      Object.entries(opts.query)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : '';

  const url = `${API_URL}${path}${qs}`;
  const res = await fetch(url, {
    method,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  const text = await res.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg = (data && data.error) || `HTTP ${res.status}`;
    if (res.status === 401) {
      useAuth.getState().logout();
    }
    throw new HttpError(res.status, data, msg);
  }

  return data as T;
}
