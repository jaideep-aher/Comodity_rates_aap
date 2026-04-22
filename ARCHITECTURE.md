# BajarBhav — Architecture

A detailed walk-through of *how* the app works: every request, every
piece of state, every background job, and how data moves from a
government APMC website to a farmer's phone in Marathi.

> If you're looking for **how to set things up**, read
> `SETUP.md` instead. This doc explains the "why" and the "flow".

---

## 1. The 30-second picture

```mermaid
flowchart LR
    subgraph "Farmer's Phone"
        A["React Native app\n(Expo SDK 51)"]
    end

    subgraph "Railway / Fly"
        B["Fastify API\n(Node 20)"]
        C["Postgres"]
        D["Redis"]
        E["Cron jobs\n(scraper, digest,\nadvisory)"]
    end

    subgraph "External"
        F["APMC Mumbai\nHTML pages"]
        G["Open-Meteo\nweather API"]
        H["Firebase Cloud\nMessaging"]
        I["OpenAI\nChat Completions"]
        J["MSG91 SMS"]
        K["Razorpay"]
    end

    A <-->|"HTTPS / JSON"| B
    B <-->|"SQL"| C
    B <-->|"cache"| D
    E -->|"cheerio parse"| F
    E --> C
    B -->|"proxy + cache"| G
    A -->|"direct fallback"| G
    B -->|"push"| H
    H -->|"FCM token"| A
    B -->|"LLM fallback"| I
    B -->|"OTP + digest"| J
    B <-->|"subscriptions"| K
```

The app works in **three modes** flipped by `app.json.extra.apiMode`:

- `mock` — 100% client-side, everything from `src/data/*.ts`.
  Great for demos and the current debug builds.
- `real` — full backend wiring; REST calls to `apiUrl`.
- `hybrid` — read prices from backend, but keep
  watchlist/onboarding state local (useful for staged rollouts).

---

## 2. Repo layout

```
new rate app/
├── src/                        # React Native app
│   ├── api/                    # fetch clients (auto-skip if mock mode)
│   ├── auth/                   # token storage + OTP flow
│   ├── components/             # reusable UI (WeatherCard, CropRibbon, …)
│   ├── data/                   # mock datasets (commodities, villages, …)
│   ├── hooks/                  # useLiveWeather, useDailyAdvisory…
│   ├── i18n/                   # Marathi + English dictionaries
│   ├── navigation/             # React Navigation stack + tabs
│   ├── screens/                # one file per screen
│   ├── store/                  # Zustand stores (persisted)
│   ├── theme/                  # colors / fonts / spacing / radii
│   ├── types/                  # shared TS types
│   └── utils/                  # advisor engine, price maths, icons, tts
│
├── backend/
│   ├── src/
│   │   ├── routes/             # Fastify route modules
│   │   ├── scraper/            # cheerio parsers + cron
│   │   ├── notifications/      # FCM sender, digest builder, advisory cron
│   │   ├── observability/      # Sentry, PostHog, pino
│   │   ├── payments/           # Razorpay webhooks + subscription logic
│   │   ├── middleware/         # JWT auth, premium gate, rate-limit
│   │   ├── data/               # seed commodity + village catalogs
│   │   ├── cache.ts            # redis wrapper (falls back to in-memory)
│   │   ├── config.ts           # env var loader
│   │   ├── db.ts               # pg pool + query helper
│   │   └── index.ts            # bootstrap
│   ├── migrations/             # 001_init, 002_marketplace, 003_advisory
│   └── scripts/
│       └── migrate.ts          # runner
│
├── android/                    # Expo-prebuild native project
├── assets/                     # app icon, adaptive icon, splash
└── app.json                    # Expo config
```

---

## 3. Client architecture (React Native)

### 3.1 Navigation tree

```mermaid
flowchart TD
    Root["NavigationContainer"]
    Root --> Cond{"onboardingDone?"}
    Cond -->|"no"| Onb["Onboarding Stack"]
    Cond -->|"yes, needsAuth"| Auth["Auth Stack"]
    Cond -->|"yes, authed"| Tabs

    Onb --> OL["OnboardingLang"]
    OL --> OP["OnboardingPhone (real mode only)"]
    OP --> OO["OnboardingOtp"]
    OO --> OC["OnboardingCrops"]
    OC -->|"setOnboardingDone(true)"| Tabs

    subgraph Tabs["Bottom Tabs"]
        H["Home"]
        P["Prices"]
        L["Learn"]
        M["Market"]
        Pr["Profile"]
    end

    Tabs --> CD["CommodityDetail"]
    Tabs --> CL["CreateListing"]
    Tabs --> CT["CreateTransport"]
    Tabs --> AA["AskAdvisor"]
    Tabs --> FD["FarmDiary"]
    Tabs --> Set["Settings"]
```

Key detail that caused a bug earlier: the top-level `<Stack.Navigator>`
decides its children via the zustand `onboardingDone` flag. Calling
`navigation.reset({routes:[{name:'Tabs'}]})` while that flag was
flipping in the same tick was calling a route that wasn't mounted yet
→ silent failure. Fix: just flip the flag, let the navigator swap
itself.

### 3.2 State layer (Zustand + AsyncStorage)

```mermaid
flowchart LR
    subgraph Stores
        S1["settings\n(lang, numerals, unit,\nonboardingDone)"]
        S2["watchlist\n(commodity ids)"]
        S3["cropInstances\n(sowing dates, variety)"]
        S4["location\n(villageId, gps)"]
        S5["weather\n(forecast cache)"]
        S6["premium\n(subscription status)"]
    end

    S1 <-->|"persist"| AS["AsyncStorage"]
    S2 <-->|"persist"| AS
    S3 <-->|"persist"| AS
    S4 <-->|"persist"| AS
    S6 <-->|"persist"| AS
    S5 -.->|"10-min TTL"| Mem["in-memory only"]
```

Each store is:

```ts
create<T>()(persist((set, get) => ({ ... }), {
  name: 'store-key-v1',
  storage: createJSONStorage(() => AsyncStorage),
}))
```

Bumping a key to `-v2` is the migration strategy (cheap, fine for a
pre-launch app).

### 3.3 API client (`src/api/client.ts`)

```ts
const IS_REAL = Constants.expoConfig?.extra?.apiMode === 'real';

async function http(path, opts) {
  if (!IS_REAL) return null;                       // short-circuit
  const token = await SecureStore.getItemAsync('jwt');
  const res = await fetch(API_URL + path, {
    headers: { 'content-type': 'application/json',
               ...(token && { authorization: `Bearer ${token}` }) },
    ...opts,
  });
  if (!res.ok) throw await res.json();
  return res.json();
}
```

Every API wrapper (`prices.ts`, `watchlist.ts`, `weather.ts`, `ask.ts`,
`marketplace.ts`, `premium.ts`) is a thin `http('/api/...')` call. They
**all no-op and return local mock data** when `apiMode === 'mock'`, so
the UI is identical in either mode.

---

## 4. Data flow — the six journeys

### 4.1 Cold start → Home screen

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant A as App (JS)
    participant AS as AsyncStorage
    participant WS as weatherStore
    participant OM as Open-Meteo (or backend proxy)
    participant W as Watchlist

    U->>A: Launch
    A->>AS: rehydrate zustand stores
    AS-->>A: settings, watchlist, location, cropInstances
    A->>A: AppNavigator decides root (onboardingDone)
    A->>WS: useLiveWeather() hook mounts
    WS->>AS: cached forecast fresh?
    alt cache < 10 min
        WS-->>A: serve cached
    else stale
        WS->>OM: GET /forecast?lat=..&lng=..
        OM-->>WS: 5-day forecast
        WS->>AS: persist + timestamp
        WS-->>A: forecast
    end
    A->>W: read watched commodity ids
    A->>A: render PriceCard x N + WeatherCard + AdvisorySuggestions
```

### 4.2 Onboarding → first crop selection

```mermaid
sequenceDiagram
    participant U as User
    participant OL as OnboardingLangScreen
    participant OC as OnboardingCropsScreen
    participant SS as settingsStore
    participant WL as watchlistStore
    participant Nav as AppNavigator

    U->>OL: pick Marathi / English
    OL->>SS: setLanguage('mr')
    OL->>Nav: navigate('OnboardingCrops')
    U->>OC: tap tomato, onion, potato
    OC->>WL: toggle(id) x 3
    U->>OC: tap "Continue"
    OC->>SS: setOnboardingDone(true)
    SS-->>Nav: re-render (onboardingDone flipped)
    Nav->>Nav: stack swaps to Tabs automatically
```

Note step 8: no imperative `navigation.reset()` — the navigator
auto-switches based on the zustand flag. This is the standard
React-Navigation auth-flow pattern.

### 4.3 Real-data price fetch

```mermaid
sequenceDiagram
    autonumber
    participant App
    participant API as Fastify /api/prices
    participant R as Redis
    participant PG as Postgres

    App->>API: GET /api/prices/latest?market=apmc_mumbai&cat=veg
    API->>R: GET prices:apmc_mumbai:veg:latest
    alt cache hit
        R-->>API: JSON array
    else miss
        API->>PG: SELECT p.*, c.name, c.slug FROM prices p JOIN commodities c …\n  WHERE market=$1 AND date = (SELECT MAX(date) FROM prices WHERE market=$1)
        PG-->>API: rows
        API->>R: SET ex 600 prices:…
    end
    API-->>App: [{commodity, min, max, avg, arrival, dateISO}, …]
    App->>App: normalise to qtl vs per-kg\nrender PriceCard in Marathi numerals
```

### 4.4 APMC scraper cron

```mermaid
flowchart LR
    Cron["node-cron\n0 11,15,19 * * *"] -->|"tick"| Run["runScraper()"]
    Run --> Iter{"for each source\nin SOURCES"}
    Iter -->|"undici.fetch"| HTML["APMC HTML"]
    HTML --> Parse["cheerio → rows"]
    Parse --> Normalize["map Marathi names →\ncommodity_id via commodityMap.ts"]
    Normalize --> Upsert["UPSERT into prices\n(market, commodity_id, date, min, max, avg, arrival)"]
    Upsert --> Threshold["check thresholds.ts\nfor watchlist spikes"]
    Threshold -->|"if spike"| Queue["enqueue push:\nkind='spike'"]
    Upsert --> Invalidate["DEL prices:*:latest"]
    Queue --> Sender["notifications/sender.ts\n→ firebase-admin"]
```

Parsing is deliberately resilient: parsers accept both the current
APMC Mumbai table format and a generic "आवक / किमान / कमाल / सरासरी"
table so adding Pune / Nashik / Solapur is URL+mapping only.

### 4.5 Morning digest + advisory

```mermaid
sequenceDiagram
    participant C as cron 07:30 IST
    participant D as digest.ts
    participant PG as Postgres
    participant T as templates.ts
    participant F as FCM / MSG91
    participant P as Phone

    C->>D: tick
    D->>PG: SELECT u.*, w.commodity_ids FROM users u\n  JOIN watchlists w ON w.user_id = u.id
    loop for each user
        D->>PG: latest prices for user's commodities
        D->>T: buildDigestMessage(user.lang, rows)
        T-->>D: { title, body, dataPayload }
        alt user has fcm_token
            D->>F: send(fcm_token, payload, kind='daily_digest')
        else sms_enabled && phone verified
            D->>F: MSG91 SMS with template DIGEST
        end
        D->>PG: INSERT notifications_sent
    end

    Note over C: cron 06:00 IST → advisories.ts runs\nsame shape but with weather-based body
```

### 4.6 Ask Advisor (local → LLM escalation)

```mermaid
sequenceDiagram
    participant U as User
    participant AS as AskAdvisorScreen
    participant Local as askAdvisor.ts (rules)
    participant API as /api/ask
    participant LLM as OpenAI

    U->>AS: "तुराचं किती पाणी द्यावं?"
    AS->>Local: classify + match rule
    alt rule matched
        Local-->>AS: { answer, needsEscalation: false }
        AS-->>U: render canned answer (TTS optional)
    else no rule
        Local-->>AS: { needsEscalation: true }
        AS->>API: POST /api/ask {question, lang, context}
        API->>API: inject system prompt\n(Marathi farmer, 2-3 sentences, safe advice)
        API->>LLM: chat.completions (gpt-4o-mini)
        LLM-->>API: answer
        API->>API: INSERT ask_logs (user_id, question, answer, source, lang)
        API-->>AS: { answer, source: "llm" }
        AS-->>U: render + TTS
    end
```

---

## 5. Data model

```mermaid
erDiagram
    users ||--o{ device_tokens : has
    users ||--o{ watchlists : has
    users ||--o{ cropInstances : tracks
    users ||--o{ listings : posts
    users ||--o{ transport_offers : offers
    users ||--o{ subscriptions : buys
    users ||--o{ ask_logs : queries
    users ||--o{ notifications_sent : receives

    commodities ||--o{ prices : priced
    markets ||--o{ prices : hosts

    users {
        uuid id PK
        text phone UK
        text name
        text language
        text village
        text village_id
        double latitude
        double longitude
        text role
        timestamptz created_at
    }

    commodities {
        int id PK
        text slug UK
        jsonb name "{mr, en}"
        text category
        text icon_key
    }

    prices {
        bigint id PK
        text market FK
        int commodity_id FK
        date date
        int min_paise
        int max_paise
        int avg_paise
        int arrival_qtl
    }

    notifications_sent {
        bigint id PK
        uuid user_id FK
        text kind "daily_digest | threshold | spike | advisory"
        jsonb payload
        timestamptz sent_at
    }

    ask_logs {
        bigint id PK
        uuid user_id FK
        text question
        text answer
        text source "llm | fallback"
        text lang
        timestamptz created_at
    }
```

Price storage uses **paise** (₹×100) as `int`, never `float`, to avoid
currency rounding bugs. Client converts per unit (`qtl` / `kg`) and
locale-formats in Marathi numerals (`१`, `२`, `३`…).

---

## 6. Mode switching in detail

`app.json`:

```json
"extra": { "apiMode": "mock" | "real" | "hybrid" }
```

| What's mocked | `mock` | `hybrid` | `real` |
|---|---|---|---|
| Prices | ✅ local JSON | ❌ backend | ❌ backend |
| Watchlist | local | local | backend + local |
| Auth | auto-signed-in | local | phone OTP |
| Weather | mock 5-day | Open-Meteo direct | Backend proxy |
| Notifications | none | local only | FCM + local |
| Listings | ✅ mock | ❌ backend | ❌ backend |
| Ask Advisor | rules only | rules only | rules + LLM |

Switching is rebuild-required because `IS_REAL` is read at JS init from
the embedded Expo constants. A future improvement would be reading it
from AsyncStorage so QA can toggle modes without reinstalling.

---

## 7. Background timing

```mermaid
gantt
    title Backend cron schedule (Asia/Kolkata)
    dateFormat  HH:mm
    axisFormat  %H:%M

    section Scraper
    APMC Mumbai crawl    :06, 11:00, 15m
    APMC Mumbai crawl    :07, 15:00, 15m
    APMC Mumbai crawl    :08, 19:00, 15m

    section Advisory
    Hyper-local weather push :a1, 06:00, 30m

    section Digest
    Daily price digest       :a2, 07:30, 30m
```

The scraper runs **after** each APMC upload window (morning arrivals
~10:30, afternoon 14:30, evening 18:30). Advisories go out at 06:00
before the farmer goes to the field. Digest goes at 07:30 so it lands
while they're having chai.

---

## 8. Security boundaries

```mermaid
flowchart TB
    A["Public app\n(any IP)"] -->|"Rate-limited 120/min"| G["Gateway\n(Fastify + @fastify/rate-limit)"]
    G -->|"JWT required"| Auth["/api/* (most)"]
    G -->|"open"| Open["/api/prices, /api/commodities,\n/api/markets, /api/weather"]
    G -->|"open + OTP"| OTP["/api/auth/request-code,\n/api/auth/verify-code"]
    Auth -->|"role = premium"| PG["premium endpoints"]
    G -->|"webhook secret"| WH["/api/subscriptions/webhook\n(Razorpay HMAC)"]
    G -.->|"admin header"| Adm["/health/scrape-now,\n/api/admin/*"]
```

- **JWT** (HS256) signed with `JWT_SECRET`, 90-day expiry, stored in
  `SecureStore` on device.
- **OTP** codes are bcrypt-hashed in DB with 10-min TTL + attempt
  counter.
- **Razorpay webhook** signature verified against
  `RAZORPAY_WEBHOOK_SECRET` before any DB write.
- **Admin endpoints** gated by a simple shared header in `ADMIN_TOKEN`
  (good enough for an unlisted internal URL; move to mTLS if exposing
  publicly).
- **PII minimisation**: we store `phone` for login, never OTP
  plaintext; `name` and `village` are optional; GPS lat/lng are stored
  rounded to 2 decimals (~1 km resolution).

---

## 9. Internationalisation

```mermaid
flowchart LR
    T["component renders\nuseDict() → t"] --> L{"settings.language"}
    L -->|"mr"| M["MR dictionary\n(src/i18n/mr.ts)"]
    L -->|"en"| E["EN dictionary\n(src/i18n/en.ts)"]
    M --> R["t.buyNow = 'खरेदी करा'"]
    E --> R2["t.buyNow = 'Buy now'"]

    N["number render\nformatNumeral(123)"] --> Num{"settings.numerals"}
    Num -->|"auto && mr"| D["१२३ (Devanagari)"]
    Num -->|"auto && en"| D2["123 (Arabic)"]
    Num -->|"forced"| D3["user's choice"]
```

Every user-facing string goes through `t.*`. The dict type is
`keyof typeof en` so TS catches missing translations at compile time.

---

## 10. Performance notes

- **Metro bundle size (prod)**: ~1.8 MB minified + Hermes bytecode.
- **Cold-start to first interactive frame**: ~850 ms on a Redmi 9A.
- **Price list render**: `<FlatList>` with `getItemLayout` +
  `removeClippedSubviews` for 60 fps on 200+ items.
- **Weather** is fetched once per location change and cached 10 min —
  Open-Meteo rate-limits unauthenticated clients to 10 000 calls/day,
  so we only hit it when we must.
- **Zustand selectors** are granular (`useWatchlist(s => s.ids)`)
  to avoid unnecessary re-renders when unrelated state changes.
- **Images** are all vector (`react-native-svg`) or PNG at density —
  no runtime scaling.
- **Hermes** is on; `__DEV__` blocks are stripped in release.

---

## 11. What's deliberately *not* built yet

- Real-time prices via WebSocket (polling is fine at the current scale
  — prices update 3×/day).
- Map view of nearby mandis (would need a tile provider budget).
- Voice input for Ask Advisor (only TTS output is implemented; STT
  would pull `@react-native-voice/voice` which adds ~8 MB).
- Offline-first price sync (IndexedDB-style queue). Currently "no
  network" shows last cached + a banner.
- A/B testing framework (PostHog feature flags are wired but not used
  anywhere yet).

---

## 12. Glossary

| Term | Meaning |
|---|---|
| APMC | Agricultural Produce Market Committee — government-run wholesale markets where farmers auction produce. |
| Bajar bhav | Marathi for "market rate" (बाजार भाव). |
| Arrival (आवक) | Volume of a commodity that arrived at the market that day, in quintals. |
| Quintal (qtl) | 100 kg. Standard APMC reporting unit. |
| FCM | Firebase Cloud Messaging. |
| OTP | One-time password sent over SMS. |
| EAS | Expo Application Services — managed build+submit pipeline. |
| Hermes | Facebook's JS engine optimised for mobile; compiles to bytecode at build time. |

---

**See also**: `SETUP.md` for environment setup,
`backend/migrations/*.sql` for the authoritative schema,
`src/data/*.ts` for the mock datasets that seed the whole experience.
