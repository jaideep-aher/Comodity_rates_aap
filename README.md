# BajarBhav (बाजारभाव)

Mumbai APMC market rates + marketplace, built for farmers. Marathi-first, Android-first, offline-first.

**Status:** Stage 6 — **Intelligent Co-pilot**. On top of the Stage 5 advisory core, the app now pulls real hyper-local weather, listens to the farmer's GPS, remembers the exact variety in every field, schedules a morning advisory notification, answers free-form questions from a chat screen, and — when it can't — escalates to a backend LLM. The backend learned how to proxy weather, fan out morning advisories to every user's watchlist, and log Ask-Advisor queries.

Stage 6 shipping:

**Live weather & location**

- **Open-Meteo powered forecast** — `src/api/weather.ts` fetches real 7-day data + hourly rain probability keyed off lat/lng. Caches for 1 h per cell, falls back to backend proxy → direct Open-Meteo → stale cache → mock. WeatherCard, Farm-Actions, and Rain-Radar now all show a **live** / **offline** dot.
- **Village picker** — new `VillagePickerModal` with search (Marathi/English/pincode) plus a **Use current location** button that calls `expo-location`, reverse-geocodes to the nearest village in `src/data/villages.ts`, and pins it. Available from the Home hero and Profile.
- **Location store** (`useLocation`) — single source of truth; prefers GPS < 12 h old, falls back to village lat/lng. Changes auto-sync to backend `/api/me` in real mode so the advisory cron can reach the farmer.

**Variety-aware agronomy**

- **Variety picker** in the sowing sheet — per-crop options (tomato Sahoo/Abhinav, onion Rabi/Kharif, soybean JS 335/KS 103, etc.) drive total days to harvest, yield per acre, and stage length in `src/data/varieties.ts`.
- `lifecycleFor`, `stageAt`, and `daysToHarvest` all accept the variety id and scale stage boundaries proportionally.

**Morning advisory (two paths)**

- **Client-side scheduler** (`useDailyAdvisoryNotifications`) — at launch, schedules a 06:00 local notification via `expo-notifications` based on tomorrow's weather + the top watchlisted crop. Dedup'd in AsyncStorage so a day only fires once. No-ops when the native module is unbundled.
- **Server-side cron** (`backend/src/notifications/advisories.ts`) — at `06:00 IST` iterates every user with a watchlist + stored location, fetches a cached forecast per ~1 km cell, and sends a short FCM push (kind: `advisory`). Extends `notifications_sent` CHECK constraint and dedups per user per day.

**Ask Advisor (chat)**

- **Local rule engine** (`src/utils/askAdvisor.ts`) — Marathi + English keyword matchers covering weather, spraying, harvest, irrigation, heat/cold, crop stages, tasks, sensitivity. Returns `needsEscalation` when nothing matches.
- **LLM escalation** — `src/api/ask.ts` calls backend `/api/ask`, which proxies OpenAI (`OPENAI_API_KEY`) with a tight Maharashtra-farmer system prompt and logs Q&A to the new `ask_logs` table. If the key is missing or OpenAI fails, the backend returns a polite Marathi/English fallback that still references the Kisan helpline.
- **AskAdvisorScreen** — chat UI with suggested-question chips, bubbles, a "Kisan-AI answer" badge on LLM responses, and graceful degradation to the canned fallback.

**Farm diary analytics**

- `FarmDiaryScreen` rolls up every tapped task across crops into a tally (💧 irrigations, 🧪 sprays, 🌾 harvests…) + a chronological log. Accessible from Learn and Profile.

**Backend**

- `GET /api/weather/forecast?lat=&lng=` — Open-Meteo proxy with Redis cache.
- `POST /api/ask` — LLM fallback + DB logging.
- `startAdvisoryCron()` — new cron, wired into `index.ts` alongside the digest.
- Migration `003_advisory.sql` adds `users.village_id / latitude / longitude`, an `ask_logs` table, and extends the notification kind enum.
- `PATCH /api/me` now accepts `village_id`, `latitude`, `longitude`.

Stage 5 shipping:

- **Today's Farm Actions strip** — four chips (💧 Irrigate, 🧪 Spray, 🌾 Harvest, 🚜 Plough) with ✅/⚠️/❌ verdicts, computed from today's + tomorrow's weather. Tap opens a bottom-sheet with the full one-line Marathi reason.
- **Rain radar (next 12 hours)** — emoji+bar visual of hourly rain probability. Hidden on dry days so the Home screen stays calm.
- **Crop-personalised heat-stress chips** — each watchlisted crop gets a 🟢/🟡/🔴 badge on the weather card based on `src/data/cropSensitivity.ts` thresholds (tomato stresses at 34°C, onion at 38°C, …).
- **Weather card redesign** — 7-day forecast tiles now carry a per-day action tag (🌧️ avoid spray, 🌾 good to harvest, etc.) instead of a generic icon.
- **Crop stage ribbon** on the commodity detail — 🌱→🌿→🪴→🌸→🍅→🧺 pipeline anchored off the farmer-entered sowing date; auto-picks the right stage and highlights today.
- **This week's tasks card** — irrigation / spray / fertiliser / harvest checklist per crop × stage, with tap-to-complete persistence (`cropInstancesStore`). Spray tasks auto-flag "⚠️ skip: rain at 80%" when weather conflicts.
- **Days-to-harvest countdown** on Home — one card per watchlisted crop with sowing date, showing a progress bar + estimated revenue range (today's APMC avg × yield × area).
- **Sow Now strip** on the Learn tab — auto-lists crops whose sowing window covers the current month so farmers can discover what to plant.
- **Sowing-date sheet** — a no-native-deps day picker (today chip + "x days ago" scroller) that captures the anchor when the farmer adds a crop.
- **TTS playback 🔊** — Marathi-locale text-to-speech on the weather card, farm-action sheet, and weekly tasks via `expo-speech`. Degrades gracefully to hidden when the native module isn't bundled.
- **Share-to-WhatsApp 📤** — the weather card (and the action sheets via TTS text) export a plain-text advisory through the system share sheet, so a farmer can forward today's advice to their group.
- **Advisor rules engine** (`src/utils/advisor.ts`) — pure, unit-testable functions (`evaluateAllActions`, `heatStressFor`) that future Stage 6 real-weather APIs can feed straight into.

Previous Stage 4 capabilities (Marathi numerals toggle, custom SVG set, news/schemes/helpline/videos, crop calendar, profit calculator, new Learn tab) are all retained and still functional.

The app still runs in **mock mode** standalone — flip one env var to go real.

## Modes

| Mode   | Data                              | Auth              | Push / SMS          | Marketplace | Payments |
|--------|-----------------------------------|-------------------|---------------------|-------------|----------|
| `mock` | seeded `src/data/commodities.ts`  | auto-local user   | simulated           | empty; UI fully functional | mock checkout auto-succeeds |
| `real` | backend + multi-market APMC scrape | Phone OTP (MSG91) | FCM + MSG91 SMS     | Postgres-backed | Razorpay |

Flip via `EXPO_PUBLIC_API_MODE=real` and `EXPO_PUBLIC_API_URL=...`, or set `expo.extra.apiMode` in `app.json`.

## Run locally (mock mode)

```bash
cd "new rate app"
npm install
npm run android
```

## Run end-to-end (real mode)

```bash
# 1. Backend
cd "new rate app/backend"
cp .env.example .env
docker compose up -d
npm install
npm run migrate && npm run seed
npm run scrape       # one-off to populate today's prices
npm run dev          # http://localhost:4000

# 2. App
cd ..
EXPO_PUBLIC_API_MODE=real \
EXPO_PUBLIC_API_URL=http://<your-lan-ip>:4000 \
  npm run android
```

Dev niceties:
- `DEV_OTP_ANY=true` lets any 4+ digit code verify OTPs.
- If Razorpay isn't configured, `/api/me/subscription/checkout` returns a mock order that the app can auto-verify with `signature: 'mock-signature'` — so the full paywall UX is testable without a Razorpay account.
- If `FCM_SERVICE_ACCOUNT_JSON` is blank, push sends are logged to stdout instead of delivered.

## Stage 3 features

### Marketplace (Trade tab)

- **Farmer listings:** post a sell-side listing (commodity, quantity in quintals, quality grade, ask price, village/district, photos, notes). Browseable publicly; inquiries require login.
- **Buyer directory:** commercial buyers (wholesalers, processors) create a profile with categories they buy, monthly volume, contact. Verified + paid buyers float to the top.
- **Inquiries:** logged-in users send messages (+ optional counter-offer) against listings. Sellers see incoming inquiries in their inbox.
- **Contact buttons:** one-tap Call + WhatsApp via native `Linking`.

### Transport marketplace

- Farmers & buyers post transport **requests** (from/to, quantity, by-date, budget).
- Truck operators maintain a profile and post **offers** (truck type, capacity, route, price).
- Both sides can call/WhatsApp directly.

### Premium

- Razorpay checkout (monthly ₹49 / yearly ₹499). Server verifies HMAC signature on `/me/subscription/verify` and on webhook `/webhooks/razorpay`.
- Gated features:
  - **Multi-market price comparison** (Pune, Nashik, Solapur) on every commodity detail page.
  - **1-year price history** via `?days=365`.
  - **SMS digest fallback** (flag `sms_fallback` on user; digest cron sends both push + MSG91 SMS).
  - CSV export (hook in `/api/me/export` — to be exposed on demand).
- `PremiumGate` component shows an unlock card wherever a feature is locked.

### Multi-market scraper

- Default enabled: `apmc_mumbai`.
- Add markets via `SCRAPER_MARKETS=apmc_mumbai,apmc_pune,apmc_nashik,apmc_solapur`. URLs and parser slot are declared in `backend/src/scraper/sources.ts` — update them once the real daily-rates pages are known.
- `/api/markets` lists available markets with `isPremium` flags.

### Observability

- **Sentry** (backend + app) via `SENTRY_DSN` / `expo.extra.sentryDsn`. No-op if unset.
- **PostHog** via `POSTHOG_API_KEY` / `expo.extra.posthogApiKey`. `track()` helper in `src/utils/analytics.ts`; backend mirrors events to its own `events` table so we always have a local audit trail.
- Anonymisation: `analytics_opt_in` column on `users`; UI toggle lives on Profile.

### Release

- `eas.json` sets three profiles: `development` (Expo Go, mock), `preview` (internal APK), `production` (AAB for Play Store, points at `api.bajarbhav.in`).
- `.github/workflows/ci.yml` typechecks app + backend, runs migrations against a Postgres service, and builds the backend Docker image.
- `backend/docker-compose.prod.yml` spins Postgres + Redis + API behind a reverse proxy.

## Build & ship

```bash
# Preview APK for internal testing
eas build --profile preview --platform android

# Production AAB for Play Store
eas build --profile production --platform android
eas submit  --profile production --platform android
```

## Project layout (new in Stage 3)

```
new rate app/
├── eas.json
├── .github/workflows/ci.yml
├── src/
│   ├── api/
│   │   ├── marketplace.ts           # listings, buyers, transport
│   │   └── premium.ts               # markets, plans, checkout
│   ├── components/
│   │   ├── ListingCard.tsx
│   │   └── PremiumGate.tsx
│   ├── screens/
│   │   ├── MarketplaceScreen.tsx
│   │   ├── ListingDetailScreen.tsx
│   │   ├── CreateListingScreen.tsx
│   │   ├── CreateTransportScreen.tsx
│   │   └── PremiumScreen.tsx
│   ├── store/premiumStore.ts
│   └── utils/analytics.ts
└── backend/
    ├── migrations/002_marketplace.sql
    ├── docker-compose.prod.yml
    └── src/
        ├── routes/
        │   ├── markets.ts
        │   ├── listings.ts
        │   ├── buyers.ts
        │   ├── transport.ts
        │   └── subscriptions.ts     # Razorpay checkout + webhook
        ├── middleware/premium.ts
        ├── payments/razorpay.ts
        ├── notifications/sms.ts     # MSG91 SMS fallback
        ├── scraper/sources.ts       # per-market URLs
        └── observability/
            ├── analytics.ts
            └── sentry.ts
```

## What's next (beyond Stage 6)

- IMD Agromet overlays on the weather proxy (district-level rainfall bulletins).
- Voice-input on the Ask Advisor screen (Marathi STT).
- Pest-scout photo upload → ML classification (cash-crop pest library).
- Cooperative / FPO dashboards built on top of farm-diary aggregates.
- iOS build.

Data source: [apmcmumbai.org](https://apmcmumbai.org/).
