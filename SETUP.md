# BajarBhav — Setup Guide

End-to-end playbook to take BajarBhav from a fresh clone to a working
build on a phone plus a live backend serving real APMC data and push
notifications. Nothing in this guide assumes you already have Railway,
Postgres, Redis, Firebase, or any other cloud account.

> TL;DR — Right now the app runs in **MOCK** mode (no backend, no
> database). Everything below is what you need *if and when* you want
> real data, OTP login, and push notifications.

---

## 0. What's "already set up" vs "you still need to do"

| Piece | Status | Action needed |
|---|---|---|
| Mobile app (React Native / Expo) | ✅ Working in MOCK mode | Nothing — just build & install. |
| Backend source (Fastify + Postgres) | ✅ Code written, not deployed | Deploy to Railway / Fly / Render. |
| Postgres database | ❌ Not provisioned | Create on Railway or Supabase, run migrations. |
| Redis cache | ⚠️ Optional | Create on Railway / Upstash; backend works without it. |
| APMC scraper | ✅ Code written, runs on cron | Just point it at a deployed backend. |
| OTP SMS (MSG91) | ⚠️ Optional | Works in dev mode without it (any 6-digit code logs you in). |
| Push notifications (FCM) | ❌ Not configured | Create Firebase project, download service-account JSON. |
| Weather (Open-Meteo) | ✅ Public API, no key needed | Nothing. |
| Ask Advisor LLM (OpenAI) | ⚠️ Optional | Paste `OPENAI_API_KEY` if you want LLM fallback. |
| Payments (Razorpay) | ❌ Not configured | Optional — only for premium subscriptions. |
| Analytics (PostHog) | ❌ Not configured | Optional. |
| Error tracking (Sentry) | ❌ Not configured | Optional. |

---

## 1. Local development — app only (MOCK mode, no backend)

This is what you already have. Zero services required.

### 1.1 Requirements on your Mac

```bash
# Node.js 20+
brew install node@20

# JDK 17 (Android build)
brew install openjdk@17

# Android SDK via Android Studio, or command-line tools
brew install --cask android-commandlinetools

# Make sure ANDROID_HOME is set
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$ANDROID_HOME/platform-tools:$PATH"

# Watchman for Metro bundler
brew install watchman
```

### 1.2 Install JS deps

```bash
cd "new rate app"
npm install
```

### 1.3 Run on a connected phone (debug, with Metro)

```bash
# USB debugging ON, phone plugged in
adb devices                       # verify device shows up
npx expo run:android              # builds debug APK + installs + starts Metro
```

### 1.4 Build a standalone debug APK (no Metro needed)

```bash
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
cd "new rate app/android"
GRADLE_OPTS="-Xmx6g -XX:MaxMetaspaceSize=1g" \
  ./gradlew :app:assembleDebug -x lint \
  -PreactNativeArchitectures=arm64-v8a

adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### 1.5 Build a smaller release APK

```bash
cd "new rate app/android"
GRADLE_OPTS="-Xmx6g -XX:MaxMetaspaceSize=1g" \
  ./gradlew :app:assembleRelease -x lint \
  -PreactNativeArchitectures=arm64-v8a
# ~40-60 MB, signed with debug keystore (fine for side-loading, not Play Store)
adb install -r app/build/outputs/apk/release/app-release.apk
```

---

## 2. Backend — local development

Run the Fastify API against a local Postgres so the app can switch to REAL mode.

### 2.1 Start Postgres (easiest: Docker)

```bash
docker run --name bb-postgres \
  -e POSTGRES_USER=bajarbhav \
  -e POSTGRES_PASSWORD=bajarbhav \
  -e POSTGRES_DB=bajarbhav \
  -p 5432:5432 -d postgres:16
```

(Or install natively: `brew install postgresql@16 && brew services start postgresql@16`, then create user/db.)

### 2.2 Optional: start Redis

```bash
docker run --name bb-redis -p 6379:6379 -d redis:7-alpine
```

Redis is only used for price caching and rate-limit storage — the
backend works without it but falls back to in-memory.

### 2.3 Install backend deps and env

```bash
cd "new rate app/backend"
npm install

cp .env.example .env 2>/dev/null || touch .env
```

Fill in `.env` (see §5 for the full variable reference). Minimum for
local dev:

```dotenv
NODE_ENV=development
PORT=4000
DATABASE_URL=postgres://bajarbhav:bajarbhav@localhost:5432/bajarbhav
JWT_SECRET=change-me-to-a-random-64-char-string
DEV_OTP_ANY=true
SCRAPER_ENABLED=false        # set to true when you want real data
ADVISORY_ENABLED=false
```

### 2.4 Run migrations

```bash
cd "new rate app/backend"
npm run migrate
# Applies 001_init.sql → 002_marketplace.sql → 003_advisory.sql
```

### 2.5 Start the backend

```bash
npm run dev      # tsx watch, hot reload
# or
npm run build && npm start
```

Verify:

```bash
curl http://localhost:4000/health
# => {"ok":true,"uptime":0.xx}
```

### 2.6 Point the app at the local backend

Edit `new rate app/app.json`:

```jsonc
"extra": {
  "apiMode": "real",              // was "mock"
  "apiUrl": "http://10.0.2.2:4000" // Android emulator → host
  // For a physical phone on same Wi-Fi, use your Mac's LAN IP:
  // "apiUrl": "http://192.168.1.23:4000"
}
```

Rebuild the APK and the app will now hit your local Fastify instead of
mock data.

### 2.7 Trigger a scrape manually (optional)

```bash
# With the backend running:
curl -X POST http://localhost:4000/health/scrape-now \
  -H "x-admin-token: $ADMIN_TOKEN"
# Or just flip SCRAPER_ENABLED=true; cron runs at 11:00, 15:00, 19:00 IST.
```

---

## 3. Deploy the backend to Railway (free tier is enough to start)

Railway is the fastest path because it gives you Postgres + Redis + app
runtime in one project, with automatic HTTPS.

### 3.1 Create the Railway project

1. Go to https://railway.app → **Sign in with GitHub**.
2. **New Project → Deploy from GitHub repo** → select
   `jaideep-aher/Comodity_rates_aap`.
3. Railway detects the monorepo. In the service settings:
   - **Root Directory:** `new rate app/backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run migrate && node dist/index.js`
   - **Watch Paths:** `new rate app/backend/**`
4. Add the environment variables from §5.

### 3.2 Add a Postgres plugin

1. Inside the Railway project → **New → Database → PostgreSQL**.
2. Railway auto-injects `DATABASE_URL` into every service in the
   project. You don't need to copy/paste it.

### 3.3 Add a Redis plugin (optional)

1. **New → Database → Redis** → gives you `REDIS_URL`.

### 3.4 Get your public URL

Settings → **Networking → Generate Domain** →
`https://bajarbhav-api.up.railway.app`

### 3.5 Point the app at production

In `app.json`:

```jsonc
"extra": {
  "apiMode": "real",
  "apiUrl": "https://bajarbhav-api.up.railway.app"
}
```

Rebuild the APK and ship.

### 3.6 Alternatives if you don't want Railway

- **Fly.io**: `fly launch` inside `backend/`, add a Postgres with
  `fly postgres create`.
- **Render.com**: New Web Service → connect repo → root `new rate
  app/backend` → build `npm ci && npm run build` → start
  `npm run migrate && node dist/index.js`. Add a Render Postgres.
- **Supabase + Vercel**: Use Supabase Postgres for the DB
  (`DATABASE_URL` from the dashboard), deploy the Fastify app to
  Vercel via `vercel.json` — works but Vercel functions are
  stateless, so cron jobs need an external scheduler (Upstash
  QStash or GitHub Actions cron).
- **Self-hosted VPS**: `pm2 start dist/index.js --name bajarbhav`
  behind nginx with Let's Encrypt.

---

## 4. Firebase Cloud Messaging (FCM) — push notifications

Without FCM the app can still show **local** notifications (morning
advisories) but the server can't send price alerts.

### 4.1 Create a Firebase project

1. https://console.firebase.google.com → **Add project** → name it
   `BajarBhav`.
2. Skip Google Analytics (or enable — either works).

### 4.2 Register the Android app

1. Project Overview → **Add app → Android**.
2. Package name: `com.agro.agrofix`  *(must match `app.json`
   `android.package` and your Play Console app)*.
3. App nickname: `BajarBhav`.
4. Download `google-services.json`.
5. Place it at **`new rate app/android/app/google-services.json`**.
6. The Expo config plugin already wires up `apply plugin:
   'com.google.gms.google-services'` in
   `android/app/build.gradle` — nothing else to edit.

### 4.3 Generate a service-account JSON for the backend

1. Firebase Console → ⚙️ **Project settings → Service accounts**.
2. **Generate new private key** → downloads a JSON file. Keep this
   secret.
3. **Do not commit this file.** Instead, copy its entire contents
   and paste as a single-line string into Railway env:
   ```
   FCM_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"bajarbhav",...}
   ```
   (Railway UI preserves multi-line, but keeping it compact avoids
   YAML/env escaping issues.)

### 4.4 Verify

Once deployed, the backend logs will show
`firebase-admin initialised` on boot. When the app registers a
device token, you'll see a row in the `device_tokens` table.

### 4.5 Send a test push

```bash
curl -X POST https://your-api.up.railway.app/api/admin/push-test \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -H "content-type: application/json" \
  -d '{"userId":"<uuid>","title":"Test","body":"It works"}'
```

---

## 5. Environment variable reference (backend `.env`)

Required in production:

```dotenv
NODE_ENV=production
PORT=4000
DATABASE_URL=postgres://user:pass@host:5432/db
JWT_SECRET=64-char-random-string          # `openssl rand -hex 32`
```

Recommended:

```dotenv
REDIS_URL=redis://default:password@host:6379
LOG_LEVEL=info
```

APMC scraper:

```dotenv
SCRAPER_ENABLED=true
SCRAPER_CRON=0 11,15,19 * * *             # 11 / 15 / 19 IST
SCRAPER_MARKETS=apmc_mumbai               # comma-separated
SCRAPER_USER_AGENT=BajarBhavBot/0.1 (+https://bajarbhav.in)
DATA_SOURCE=apmcmumbai.org
```

OTP login:

```dotenv
# Railway toggle: false = phone-only sign-in (no SMS, no OTP screen; one POST /auth/otp/verify).
# Default true. Keep true in production unless you accept the weaker trust model.
OTP_VERIFICATION_ENABLED=true

DEV_OTP_ANY=false                         # dev: any 4+ digit code; prod: require real SMS match
MSG91_AUTH_KEY=xxx
MSG91_TEMPLATE_ID=xxx
MSG91_SENDER_ID=BAJARB
```

Push:

```dotenv
FCM_SERVICE_ACCOUNT_JSON={...}            # see §4.3
DIGEST_CRON=30 7 * * *                    # morning digest
DIGEST_TIMEZONE=Asia/Kolkata
```

Stage 6 — weather & LLM:

```dotenv
OPEN_METEO_BASE=https://api.open-meteo.com/v1/forecast
OPENAI_API_KEY=sk-...                     # optional; without it falls back to rules
OPENAI_MODEL=gpt-4o-mini
ADVISORY_CRON=0 6 * * *                   # 06:00 IST daily local advisory push
ADVISORY_ENABLED=true
```

Payments (Razorpay — only for premium):

```dotenv
RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx
PREMIUM_MONTHLY_PAISE=4900                # ₹49
PREMIUM_YEARLY_PAISE=49900                # ₹499
```

SMS digest (fallback for users with no push):

```dotenv
SMS_ENABLED=false
MSG91_DIGEST_TEMPLATE_ID=xxx
```

Observability:

```dotenv
SENTRY_DSN=https://xxx@sentry.io/yyy
POSTHOG_API_KEY=phc_xxx
POSTHOG_HOST=https://app.posthog.com
```

Mobile **force-update** (optional — real API mode only; see `GET /api/client-config`):

```dotenv
# Block app versions older than this (e.g. after a breaking API change).
MIN_APP_VERSION=0.8.0

# Block app versions newer than this (e.g. pulled a bad release; rarely needed).
MAX_APP_VERSION=

ANDROID_STORE_URL=https://play.google.com/store/apps/details?id=com.agro.agrofix
IOS_STORE_URL=
```

The same endpoint returns **`otpVerificationEnabled`** (mirrors `OTP_VERIFICATION_ENABLED`) so the app can skip the OTP screen when the server has verification turned off.

### 5.1 Firebase Crashlytics + product analytics (app)

The app uses **Firebase only for Crashlytics** (crashes and `recordError`). **Screens, taps, and custom events** go to **PostHog** when `posthogApiKey` is set in `app.json` `extra` — not to Firebase Analytics.

After `npx expo prebuild` / EAS Build, native projects pick up:

- Root **`google-services.json`** (Android) — from Firebase Console → Your apps → Android `com.agro.agrofix`.
- Root **`GoogleService-Info.plist`** (iOS) — for iOS builds.

Enable **Crashlytics** in the Firebase console. **Sentry** (`sentryDsn`) is optional in addition to Crashlytics for errors.

---

## 6. Database migrations

Location: `new rate app/backend/migrations/`

| File | What it adds |
|---|---|
| `001_init.sql` | `users`, `device_tokens`, `watchlists`, `commodities`, `prices`, `markets`, `notifications_sent` |
| `002_marketplace.sql` | `listings`, `buyers`, `transport_offers`, `subscriptions`, `payments` |
| `003_advisory.sql` | `users.village_id/latitude/longitude`, extended notification kinds, `ask_logs` |

Running migrations:

```bash
npm run migrate               # from new rate app/backend
```

The runner is idempotent — it tracks applied migrations in a
`schema_migrations` table.

Rolling back: write a new forward migration (`004_rollback_xxx.sql`).
We don't keep `.down.sql` files by design.

---

## 7. Optional services

### 7.1 OpenAI (Ask Advisor)

Without a key, the Ask Advisor screen uses the client-side rule
engine + a canned fallback string. With a key, unknown questions are
forwarded to `gpt-4o-mini` via the `/api/ask` backend endpoint which
injects a Marathi-farmer system prompt and logs every interaction to
`ask_logs` for abuse monitoring.

Cost: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens on
`gpt-4o-mini`. Budget ₹500/month covers ~10k farmer queries.

### 7.2 Razorpay (premium subscriptions)

1. Create Razorpay account → **KYC → activate live mode**.
2. Dashboard → **Settings → API Keys → Generate**.
3. Dashboard → **Settings → Webhooks → New**:
   - URL: `https://your-api.up.railway.app/api/subscriptions/webhook`
   - Events: `subscription.activated`, `subscription.charged`,
     `subscription.cancelled`, `payment.failed`.
4. Paste `key_id`, `key_secret`, `webhook_secret` into env.
5. The app renders the paywall automatically when
   `config.extra.paymentsEnabled` is true.

### 7.3 PostHog & Sentry (free tiers)

Both have **free cloud tiers** (limits reset monthly on PostHog; Sentry’s
developer/free tier is enough to try). You only **pay if you exceed**
those limits or upgrade.

#### PostHog (product analytics — screens & `track()` events)

1. Go to [https://posthog.com](https://posthog.com) → **Get started — free**.
2. Create an organization and a **project** (e.g. `BajarBhav`).
3. Open **Project settings** → **Project API Key** — copy the key
   (starts with `phc_`).
4. Note your **region**:
   - US cloud → host `https://us.i.posthog.com` **or** legacy `https://app.posthog.com`
   - EU cloud → host `https://eu.i.posthog.com`  
   Use the host shown in PostHog’s “API” or “Project settings” for your project.
5. In **`app.json`** → `expo.extra`:
   ```jsonc
   "posthogApiKey": "phc_xxxxxxxx",
   "posthogHost": "https://us.i.posthog.com"
   ```
   (Replace `posthogHost` with the exact base URL PostHog shows for your project.)
6. Rebuild the app (keys are baked in at build time via `expo-constants`).
7. Optional **backend** (server-side events): set `POSTHOG_API_KEY` and
   `POSTHOG_HOST` in Railway to the **same** project (see §5 Observability).

**Free tier (check [posthog.com/pricing](https://posthog.com/pricing)):**  
typically includes a large monthly **event** allowance (e.g. ~1M product
analytics events) without a credit card; session replay and other products
have separate monthly caps.

#### Sentry (error monitoring, alongside Firebase Crashlytics)

1. Go to [https://sentry.io](https://sentry.io) → sign up (free **Developer** plan).
2. **Create project** → platform **React Native** (matches `sentry-expo` in this app).
3. Copy the **DSN** (looks like `https://xxxx@xxxx.ingest.sentry.io/xxxx`).
4. In **`app.json`** → `expo.extra`:
   ```jsonc
   "sentryDsn": "https://....@....ingest.sentry.io/...."
   ```
5. Rebuild the app. Errors sent via `captureException()` in code will
   show in Sentry; **Crashlytics** still handles native Firebase crash
   reporting if configured.

**Free tier:** Sentry’s free developer tier includes a **limited event
volume per month** and retention; see [sentry.io/pricing](https://sentry.io/pricing).
If you only need crashes, **Firebase Crashlytics** alone may be enough;
Sentry adds richer grouping, releases, and JS stack traces in one place.

**Backend (optional):** for API errors, set `SENTRY_DSN` in Railway
(see §5) to a **Node/Fastify** (or separate) Sentry project DSN.

---

## 8. CI / CD (GitHub Actions)

The repo's `.github/workflows/` folder has:

- `backend-test.yml` — `npm ci && npm run build && npm test` on
  every push to `main`.
- `eas-preview.yml` — on PR, `eas build --profile preview` produces
  an APK link in the PR comment (requires `EXPO_TOKEN` secret).

To enable EAS builds:

```bash
npm i -g eas-cli
eas login
cd "new rate app"
eas build:configure           # writes eas.json
eas build -p android --profile preview
```

Set `EXPO_TOKEN` in GitHub → Settings → Secrets → Actions.

---

## 9. Play Store release

1. Generate an upload keystore:
   ```bash
   keytool -genkey -v \
     -keystore bajarbhav-upload.keystore \
     -alias bajarbhav -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Store it in `~/.gradle/keystores/` (never commit).
3. Reference it in `android/app/build.gradle` under
   `signingConfigs.release`.
4. `./gradlew :app:bundleRelease` → produces `app-release.aab`.
5. Upload to https://play.google.com/console → internal testing
   track first, then production.

Play Store metadata lives in `fastlane/metadata/android/mr-IN/`
(Marathi) and `en-US/` — screenshots, feature graphic, short/long
description. The feature graphic is `android/docs/logo-options/
play-store-icon.png`.

---

## 10. Troubleshooting quick table

| Symptom | Likely cause | Fix |
|---|---|---|
| `adb: INSTALL_FAILED_INSUFFICIENT_STORAGE` | Phone /data full | `adb uninstall com.agro.agrofix` then install release APK (~45 MB). |
| `Java heap space` during gradle build | Default 2 GB heap | `GRADLE_OPTS="-Xmx6g"` prefix. |
| `Plugin 'expo-module-gradle-plugin' not found` | `expo-application` version mismatch | `npm install` — the `overrides` in package.json pins it to 5.9.1. |
| `No space left on device` during build | `~/.gradle/caches` ballooning | `rm -rf ~/.gradle/caches ~/.gradle/daemon`. |
| `ECONNREFUSED localhost:4000` from phone | App pointing at `localhost` | Use `http://10.0.2.2:4000` (emulator) or LAN IP (device). |
| OTP screen stuck on "sending" | `DEV_OTP_ANY=false` with no MSG91 key | Set `DEV_OTP_ANY=true` in dev. |
| No push received | `google-services.json` missing or FCM token not registered | Check `device_tokens` table; verify Firebase project ID matches. |

---

## 11. Security checklist before going live

- [ ] Rotate `JWT_SECRET` to a 64-char random string.
- [ ] Set `DEV_OTP_ANY=false` in production.
- [ ] Generate a real upload keystore (don't ship debug-signed APK).
- [ ] Enable Firebase App Check to stop abuse of your FCM quota.
- [ ] Turn on rate-limiting (already on: 120 req/min).
- [ ] Set up a Railway/Fly **daily backup** on the Postgres addon.
- [ ] Enable Sentry and verify an error shows up within 5 min.
- [ ] Run `npm audit --production` in both `backend/` and root.
- [ ] Test the privacy-policy / terms URLs referenced in the Play
      Store listing actually resolve.

---

**Questions or stuck?** The architecture doc
(`ARCHITECTURE.md`) explains *how* each piece talks to the others —
read that alongside this setup guide when something doesn't make
sense.
