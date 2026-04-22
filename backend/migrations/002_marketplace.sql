-- Stage 3: marketplace, transport, premium, multi-market, SMS, analytics consent.

-- ─── Multi-market support ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS markets (
  slug        TEXT PRIMARY KEY,
  name_mr     TEXT NOT NULL,
  name_en     TEXT NOT NULL,
  state       TEXT NOT NULL DEFAULT 'Maharashtra',
  city        TEXT NOT NULL,
  source_url  TEXT,
  is_premium  BOOLEAN NOT NULL DEFAULT TRUE,
  enabled     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO markets (slug, name_mr, name_en, city, source_url, is_premium)
VALUES
  ('apmc_mumbai', 'मुंबई APMC', 'Mumbai APMC', 'Mumbai', 'https://apmcmumbai.org/', FALSE),
  ('apmc_pune',   'पुणे APMC',   'Pune APMC',   'Pune',   'https://puneapmc.org/',  TRUE),
  ('apmc_nashik', 'नाशिक APMC', 'Nashik APMC', 'Nashik', 'https://nashikapmc.org/', TRUE),
  ('apmc_solapur','सोलापूर APMC','Solapur APMC','Solapur','https://solapuragricultureapmc.com/', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ─── Buyer directory (commercial buyers / wholesalers / processors) ─────────

CREATE TABLE IF NOT EXISTS buyer_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  business_name   TEXT NOT NULL,
  contact_name    TEXT,
  phone           TEXT NOT NULL,
  whatsapp        TEXT,
  email           TEXT,
  gstin           TEXT,
  city            TEXT NOT NULL,
  state           TEXT NOT NULL DEFAULT 'Maharashtra',
  buys_categories TEXT[] NOT NULL DEFAULT '{}',
  monthly_volume_qtl INT,
  is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  is_paid         BOOLEAN NOT NULL DEFAULT FALSE,
  paid_until      DATE,
  about_mr        TEXT,
  about_en        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buyers_city ON buyer_profiles(city);
CREATE INDEX IF NOT EXISTS idx_buyers_verified ON buyer_profiles(is_verified, is_paid);

-- ─── Farmer listings (sell-side) ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS listings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  commodity_id   INT NOT NULL REFERENCES commodities(id) ON DELETE RESTRICT,
  quantity_qtl   NUMERIC(10,2) NOT NULL,
  quality_grade  TEXT NOT NULL DEFAULT 'standard' CHECK (quality_grade IN ('premium', 'standard', 'value')),
  ask_price      INT NOT NULL,
  is_negotiable  BOOLEAN NOT NULL DEFAULT TRUE,
  village        TEXT NOT NULL,
  taluka         TEXT,
  district       TEXT,
  state          TEXT NOT NULL DEFAULT 'Maharashtra',
  ready_from     DATE NOT NULL DEFAULT CURRENT_DATE,
  ready_until    DATE,
  notes          TEXT,
  photos         TEXT[] NOT NULL DEFAULT '{}',
  status         TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reserved', 'sold', 'expired', 'hidden')),
  view_count     INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listings_commodity_status ON listings(commodity_id, status);
CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller_user_id);
CREATE INDEX IF NOT EXISTS idx_listings_district_status ON listings(district, status);

-- ─── Inquiries (buyer ↔ listing) ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS inquiries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id     UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  buyer_profile_id UUID REFERENCES buyer_profiles(id) ON DELETE SET NULL,
  message        TEXT NOT NULL,
  offer_price    INT,
  status         TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'seen', 'accepted', 'declined', 'withdrawn')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_inq_listing ON inquiries(listing_id);
CREATE INDEX IF NOT EXISTS idx_inq_buyer ON inquiries(buyer_user_id);

-- ─── Transport marketplace ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS transport_operators (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  phone           TEXT NOT NULL,
  whatsapp        TEXT,
  base_city       TEXT NOT NULL,
  truck_types     TEXT[] NOT NULL DEFAULT '{}',
  is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  rating_avg      NUMERIC(3,2),
  ratings_count   INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transport_city ON transport_operators(base_city);

CREATE TABLE IF NOT EXISTS transport_offers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id     UUID NOT NULL REFERENCES transport_operators(id) ON DELETE CASCADE,
  truck_type      TEXT NOT NULL,
  capacity_qtl    INT NOT NULL,
  from_city       TEXT NOT NULL,
  to_city         TEXT NOT NULL,
  available_from  DATE NOT NULL,
  available_until DATE,
  price_quote     INT,
  price_unit      TEXT NOT NULL DEFAULT 'trip' CHECK (price_unit IN ('trip', 'per_qtl', 'per_km')),
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'booked', 'expired', 'hidden')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transport_route ON transport_offers(from_city, to_city, status);

CREATE TABLE IF NOT EXISTS transport_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_city       TEXT NOT NULL,
  to_city         TEXT NOT NULL,
  commodity_id    INT REFERENCES commodities(id) ON DELETE SET NULL,
  quantity_qtl    INT NOT NULL,
  needed_by       DATE NOT NULL,
  max_budget      INT,
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'matched', 'fulfilled', 'cancelled')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_treq_route ON transport_requests(from_city, to_city, status);

-- ─── Premium subscriptions (Razorpay) ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS subscriptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan              TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  status            TEXT NOT NULL CHECK (status IN ('pending', 'active', 'cancelled', 'expired')),
  started_at        TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  amount_inr_paise  INT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subs_user ON subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subs_active ON subscriptions(status, current_period_end);

-- ─── Per-user preferences (SMS fallback, analytics consent) ────────────────

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS sms_fallback BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS analytics_opt_in BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'farmer' CHECK (role IN ('farmer', 'buyer', 'transport', 'admin'));

-- ─── SMS log (for cost tracking + dedup) ───────────────────────────────────

CREATE TABLE IF NOT EXISTS sms_sent (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  phone       TEXT NOT NULL,
  body        TEXT NOT NULL,
  provider    TEXT NOT NULL DEFAULT 'msg91',
  status      TEXT NOT NULL DEFAULT 'sent',
  dedup_key   TEXT,
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, dedup_key)
);

CREATE INDEX IF NOT EXISTS idx_sms_phone_date ON sms_sent(phone, sent_at DESC);

-- ─── Analytics events sink (backend-side, lightweight) ─────────────────────

CREATE TABLE IF NOT EXISTS events (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  props       JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_name_date ON events(name, created_at DESC);
