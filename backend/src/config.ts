import 'dotenv/config';

function env(name: string, fallback?: string): string {
  const v = process.env[name];
  if (v !== undefined && v !== '') return v;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required env var: ${name}`);
}

function optional(name: string): string | undefined {
  const v = process.env[name];
  return v && v !== '' ? v : undefined;
}

export const config = {
  port: Number(env('PORT', '4000')),
  nodeEnv: env('NODE_ENV', 'development'),
  logLevel: env('LOG_LEVEL', 'info'),

  databaseUrl: env('DATABASE_URL', 'postgres://bajarbhav:bajarbhav@localhost:5432/bajarbhav'),
  redisUrl: optional('REDIS_URL'),

  jwtSecret: env('JWT_SECRET', 'dev-only-secret-do-not-use-in-production-1234567890'),
  jwtExpiresIn: env('JWT_EXPIRES_IN', '90d'),

  devOtpAny: env('DEV_OTP_ANY', 'true') === 'true',
  msg91AuthKey: optional('MSG91_AUTH_KEY'),
  msg91TemplateId: optional('MSG91_TEMPLATE_ID'),
  msg91SenderId: env('MSG91_SENDER_ID', 'BAJARB'),

  scraperUserAgent: env('SCRAPER_USER_AGENT', 'BajarBhavBot/0.1 (+https://bajarbhav.in)'),
  scraperEnabled: env('SCRAPER_ENABLED', 'true') === 'true',
  scraperCron: env('SCRAPER_CRON', '0 11,15,19 * * *'),
  scraperMarkets: env('SCRAPER_MARKETS', 'apmc_mumbai').split(',').map((s) => s.trim()).filter(Boolean),

  fcmServiceAccountJson: optional('FCM_SERVICE_ACCOUNT_JSON'),
  digestCron: env('DIGEST_CRON', '30 7 * * *'),
  digestTimezone: env('DIGEST_TIMEZONE', 'Asia/Kolkata'),

  dataSource: env('DATA_SOURCE', 'apmcmumbai.org'),

  // Payments (Razorpay)
  razorpayKeyId: optional('RAZORPAY_KEY_ID'),
  razorpayKeySecret: optional('RAZORPAY_KEY_SECRET'),
  razorpayWebhookSecret: optional('RAZORPAY_WEBHOOK_SECRET'),

  // Premium pricing (paise = 1/100 rupee)
  premiumMonthlyPaise: Number(env('PREMIUM_MONTHLY_PAISE', '4900')),   // ₹49
  premiumYearlyPaise: Number(env('PREMIUM_YEARLY_PAISE', '49900')),    // ₹499

  // Observability
  sentryDsn: optional('SENTRY_DSN'),
  posthogKey: optional('POSTHOG_API_KEY'),
  posthogHost: env('POSTHOG_HOST', 'https://app.posthog.com'),

  // SMS
  smsEnabled: env('SMS_ENABLED', 'false') === 'true',
  smsDigestTemplate: optional('MSG91_DIGEST_TEMPLATE_ID'),

  isProd: env('NODE_ENV', 'development') === 'production',
  isDev: env('NODE_ENV', 'development') !== 'production',

  // Stage 6: weather + LLM proxy
  openMeteoBase: env('OPEN_METEO_BASE', 'https://api.open-meteo.com/v1/forecast'),
  openaiApiKey: optional('OPENAI_API_KEY'),
  openaiModel: env('OPENAI_MODEL', 'gpt-4o-mini'),
  openaiBase: env('OPENAI_BASE', 'https://api.openai.com/v1'),
  advisoryCron: env('ADVISORY_CRON', '0 6 * * *'),
  advisoryEnabled: env('ADVISORY_ENABLED', 'true') === 'true',
};
