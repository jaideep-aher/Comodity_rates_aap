# BajarBhav Backend (Stage 3)

Node.js + Fastify + Postgres + multi-market Cheerio scraper + FCM push + MSG91 SMS + Razorpay subscriptions + PostHog / Sentry hooks.

## Quick start

```bash
cd "new rate app/backend"
cp .env.example .env
docker compose up -d          # boots Postgres + Redis
npm install
npm run migrate               # create schema
npm run seed                  # seed ~127 commodities
npm run scrape                # one-off scrape to populate prices
npm run dev                   # start API at http://localhost:4000
```

Healthcheck: `curl http://localhost:4000/health` and `curl http://localhost:4000/health/db`.
Try prices: `curl http://localhost:4000/api/prices/today | jq`.

## API reference

All endpoints below are prefixed with `/api`. Auth endpoints return a JWT; protected endpoints need `Authorization: Bearer <token>`.

### Public

- `GET /prices/today` — today's snapshot for all commodities, with Δ% vs yesterday and 7-day sparkline.
- `GET /prices/today?category=veg` — filter by category (`veg | fruit | grain | turbhe`).
- `GET /prices/today?ids=1,2,3` — only specific commodity IDs (watchlist batch).
- `GET /prices/top-movers?kind=gainers|losers|arrivals` — top 10.
- `GET /commodity/:slug` — single commodity with 30-day history.
- `GET /commodities?category=veg` — static master list.

### Auth

- `POST /auth/otp/send` — body: `{ phone }`. In dev (`DEV_OTP_ANY=true`) any 4+ digit code verifies.
- `POST /auth/otp/verify` — body: `{ phone, code }` → returns `{ token, user, isNew }`.
- `GET /me` — current user.
- `PATCH /me` — update `name`, `village`, `district`, `language`.

### Watchlist

- `GET /me/watchlist` — list of `{ commodityId, alertMin, alertMax }`.
- `POST /me/watchlist` — body: `{ commodityId, alertMin?, alertMax? }`.
- `DELETE /me/watchlist/:commodityId`.
- `PUT /me/watchlist/bulk` — body: `{ commodityIds: number[] }` (replaces entire list).

### Devices (push)

- `POST /me/device-token` — body: `{ fcmToken, platform? }`.
- `DELETE /me/device-token` — body: `{ fcmToken }`.

### Marketplace — listings

- `GET /listings` — browse open listings. Filters: `commodityId, category, district, maxPrice, limit`.
- `GET /listings/:id` — single listing (increments `view_count`).
- `POST /me/listings` — create; body: `{ commodityId, quantityQtl, qualityGrade, askPrice, isNegotiable, village, taluka?, district?, readyFrom?, readyUntil?, notes?, photos? }`.
- `PATCH /me/listings/:id` — update own listing.
- `DELETE /me/listings/:id`.
- `GET /me/listings` — my listings.
- `POST /listings/:id/inquiries` — body: `{ message, offerPrice? }`.
- `GET /me/inquiries/sent`, `GET /me/inquiries/received`.

### Marketplace — buyers

- `GET /buyers` — directory. Filters: `city, category, verifiedOnly`.
- `GET /me/buyer-profile`.
- `PUT /me/buyer-profile` — upsert; auto-flips user role to `buyer`.

### Transport

- `GET /transport/offers` — list available trucks. Filters: `fromCity, toCity`.
- `POST /me/transport-offers` — operator posts an offer.
- `GET /transport/requests` — list transport requests.
- `POST /me/transport-requests` — farmer / buyer posts a need.
- `GET /me/transport-profile`, `PUT /me/transport-profile`.

### Premium / subscriptions

- `GET /premium/plans` — `{ plans, features, razorpayKeyId }`.
- `GET /me/subscription` — `{ active, plan, status, currentPeriodEnd }`.
- `POST /me/subscription/checkout` — body: `{ plan: 'monthly' | 'yearly' }` → returns Razorpay order params.
- `POST /me/subscription/verify` — body: `{ orderId, paymentId, signature }` → activates on HMAC-SHA256 match.
- `POST /webhooks/razorpay` — webhook endpoint. Verifies `x-razorpay-signature` against `RAZORPAY_WEBHOOK_SECRET`.

### Markets (multi-market)

- `GET /markets` — list enabled markets with `isPremium` flags.
- `GET /prices/today?market=apmc_pune` — scoped by market.
- `GET /commodity/:slug?market=apmc_pune&days=365` — history in any market.
- `GET /commodity/:slug/markets` — side-by-side latest snapshot across every market.

## Scraper

`src/scraper/sources.ts` enumerates every (market, URL, category) tuple. Only markets listed in `SCRAPER_MARKETS` are actually fetched. Default is `apmc_mumbai`; add `apmc_pune,apmc_nashik,apmc_solapur` once those site URLs & parser tweaks are finalised.

Mumbai uses the standard 4 URLs:

1. `…/daily-bajarbhav-dates/veg`
2. `…/daily-bajarbhav-dates/fruit`
3. `…/daily-bajarbhav-dates/dhanya`
4. `…/daily-bajarbhav-dates/turbhe`

Cheerio parses the single price table on each page (columns: name · आवक · किमान · कमाल · सरासरी). Rows are matched to `commodities.slug` via Marathi-name lookup; unmatched rows insert a row with `needs_review=TRUE` so admins can merge them later. Each run is recorded in `scrape_runs` and also invalidates the Redis price cache and triggers threshold/spike alerts. On boot the server runs one scrape after 5s so a fresh deploy has data immediately.

Run manually: `npm run scrape`.

## Notifications

- **Daily digest** (`DIGEST_CRON`, default 07:30 IST) — sends each user a top-5 watchlist summary, localized to their language. Command: `npm run digest`.
- **Threshold alerts** — after every scrape, users whose `alert_min` / `alert_max` is crossed get a push.
- **Spike alerts** — watchlist items whose |Δ%| day-over-day is ≥ 15 trigger a spike push.

Dedup is via `notifications_sent.dedup_key` so the same alert never fires twice for the same commodity on the same day.

**FCM setup:** set `FCM_SERVICE_ACCOUNT_JSON` to the full JSON blob from your Firebase service account. If unset, pushes are logged (`[push simulated]`) so you can still develop end-to-end flows.

## Database

`migrations/001_init.sql` contains the full schema. `npm run migrate` applies anything that isn't already recorded in `_migrations`. `npm run seed` (re)populates commodities.

Migrations applied in order:

- `001_init.sql` — core schema.
- `002_marketplace.sql` — `markets`, `buyer_profiles`, `listings`, `inquiries`, `transport_operators`, `transport_offers`, `transport_requests`, `subscriptions`, `sms_sent`, `events`, plus `users.sms_fallback / analytics_opt_in / role`.

Tables: `commodities`, `price_snapshots`, `users`, `otp_codes`, `watchlist`, `device_tokens`, `notifications_sent`, `scrape_runs`, plus all Stage 3 tables above.

## Payments (Razorpay)

- Set `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET`. Without them, `checkout` returns a mock order that the app auto-verifies with `signature: 'mock-signature'` so the paywall UX is testable without real payments.
- Point the Razorpay dashboard webhook at `https://<host>/api/webhooks/razorpay` and set `RAZORPAY_WEBHOOK_SECRET`. The handler verifies HMAC-SHA256 on the raw body and activates / renews subscriptions on `payment.captured`.
- Prices live in `PREMIUM_MONTHLY_PAISE` (default ₹49) and `PREMIUM_YEARLY_PAISE` (₹499).

## SMS (MSG91)

- Same `MSG91_AUTH_KEY` / `MSG91_SENDER_ID` as OTP.
- `SMS_ENABLED=true` turns on non-OTP SMS (currently the daily digest fallback).
- Users opt in via `users.sms_fallback` (wire a UI toggle; DB default is `false`).
- Dedup by `(user_id, dedup_key)` in `sms_sent`.

## Observability

- **Sentry:** set `SENTRY_DSN`. Uses `@sentry/node` loaded as an optional dep; the backend boots fine if it isn't installed.
- **PostHog:** set `POSTHOG_API_KEY`. `trackEvent(userId, 'name', props)` mirrors into the `events` table always, and into PostHog only when configured.
- A per-user `analytics_opt_in` column is the kill-switch users can flip from Profile.

## Deploy

- **Database:** any managed Postgres works (Neon, Supabase, Railway, RDS). Set `DATABASE_URL`.
- **Redis:** optional. Without it the server uses an in-memory cache (fine for a single-node deploy).
- **Server (prod):**
  ```bash
  docker compose -f docker-compose.prod.yml --env-file .env up -d --build
  ```
  The API container runs migrations (`dist/scripts/migrate.js`) before starting the server.
- Put the API behind a TLS-terminating reverse proxy (Caddy / Nginx / Cloudflare) and keep port 4000 bound to `127.0.0.1`.
- **Scraper + digest cron** run inside the main API process. For multi-node deploys, set `SCRAPER_ENABLED=false` on all but one node, or move the crons to a dedicated worker.

## Ops notes

- Source attribution is in every response (`source` field) and can be set via `DATA_SOURCE`.
- Rate limit: 120 req/min/IP (excluding `/health`).
- Logs are JSON in prod (`pino`), human-readable in dev (`pino-pretty`).
- Webhooks read the raw body via a content-type parser wired in `src/index.ts`; don't remove that parser or the Razorpay HMAC check will fail.
