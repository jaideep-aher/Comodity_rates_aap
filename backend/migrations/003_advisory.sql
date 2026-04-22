-- Stage 6: Intelligent co-pilot (advisory cron + weather/location + ask logs).

-- ─── Location for advisories ──────────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS village_id TEXT,
  ADD COLUMN IF NOT EXISTS latitude   DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude  DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS idx_users_village ON users(village_id);

-- ─── Extend notification kinds to include 'advisory' ─────────────────────
ALTER TABLE notifications_sent
  DROP CONSTRAINT IF EXISTS notifications_sent_kind_check;

ALTER TABLE notifications_sent
  ADD CONSTRAINT notifications_sent_kind_check
  CHECK (kind IN ('daily_digest', 'threshold', 'spike', 'advisory'));

-- ─── Ask-Advisor logs (for analytics + abuse monitoring) ─────────────────
CREATE TABLE IF NOT EXISTS ask_logs (
  id           BIGSERIAL PRIMARY KEY,
  user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  question     TEXT NOT NULL,
  answer       TEXT NOT NULL,
  source       TEXT NOT NULL CHECK (source IN ('llm', 'fallback')),
  lang         TEXT NOT NULL CHECK (lang IN ('mr', 'en')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ask_logs_user ON ask_logs(user_id, created_at DESC);
