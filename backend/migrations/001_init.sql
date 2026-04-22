-- BajarBhav initial schema
-- Run with: npm run migrate

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS commodities (
  id          SERIAL PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  name_mr     TEXT NOT NULL,
  name_en     TEXT NOT NULL,
  category    TEXT NOT NULL CHECK (category IN ('veg', 'fruit', 'grain', 'turbhe')),
  icon_key    TEXT NOT NULL DEFAULT 'default',
  unit        TEXT NOT NULL DEFAULT 'quintal',
  needs_review BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commodities_category ON commodities(category);

CREATE TABLE IF NOT EXISTS price_snapshots (
  id            BIGSERIAL PRIMARY KEY,
  commodity_id  INT NOT NULL REFERENCES commodities(id) ON DELETE CASCADE,
  market        TEXT NOT NULL DEFAULT 'apmc_mumbai',
  date          DATE NOT NULL,
  arrival_qtl   INT NOT NULL DEFAULT 0,
  min_price     INT NOT NULL DEFAULT 0,
  max_price     INT NOT NULL DEFAULT 0,
  avg_price     INT NOT NULL DEFAULT 0,
  scraped_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (commodity_id, market, date)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_date ON price_snapshots(date DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_commodity_date ON price_snapshots(commodity_id, date DESC);

CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       TEXT NOT NULL UNIQUE,
  name        TEXT,
  village     TEXT,
  district    TEXT,
  language    TEXT NOT NULL DEFAULT 'mr' CHECK (language IN ('mr', 'en')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id          BIGSERIAL PRIMARY KEY,
  phone       TEXT NOT NULL,
  code_hash   TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  attempts    INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_codes(phone, created_at DESC);

CREATE TABLE IF NOT EXISTS watchlist (
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  commodity_id  INT NOT NULL REFERENCES commodities(id) ON DELETE CASCADE,
  alert_min     INT,
  alert_max     INT,
  added_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, commodity_id)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id);

CREATE TABLE IF NOT EXISTS device_tokens (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fcm_token   TEXT NOT NULL,
  platform    TEXT NOT NULL DEFAULT 'android' CHECK (platform IN ('android', 'ios', 'web')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, fcm_token)
);

CREATE TABLE IF NOT EXISTS notifications_sent (
  id           BIGSERIAL PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind         TEXT NOT NULL CHECK (kind IN ('daily_digest', 'threshold', 'spike')),
  dedup_key    TEXT NOT NULL,
  payload      JSONB NOT NULL,
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, dedup_key)
);

CREATE INDEX IF NOT EXISTS idx_notifs_user_date ON notifications_sent(user_id, sent_at DESC);

CREATE TABLE IF NOT EXISTS scrape_runs (
  id          BIGSERIAL PRIMARY KEY,
  source      TEXT NOT NULL,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status      TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'failed')),
  rows_ingested INT NOT NULL DEFAULT 0,
  error       TEXT
);

CREATE INDEX IF NOT EXISTS idx_scrape_runs_date ON scrape_runs(started_at DESC);
