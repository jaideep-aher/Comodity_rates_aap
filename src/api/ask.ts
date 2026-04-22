import { API_URL, IS_REAL } from './config';

// Backend-backed LLM escalation. Used when the local rule engine can't match.
// Returns null when the backend is unreachable / not configured, so the UI
// falls back to its canned rule-base reply.

export type AskApiResponse = {
  answer: string;
  source: 'llm' | 'fallback';
};

export async function askBackend(
  question: string,
  lang: 'mr' | 'en',
): Promise<AskApiResponse | null> {
  if (!IS_REAL) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(`${API_URL}/api/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, lang }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return (await res.json()) as AskApiResponse;
  } catch {
    return null;
  }
}
