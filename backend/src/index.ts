process.stdout.write('[boot] index.ts loaded\n');
process.on('uncaughtException', (err) => {
  process.stderr.write(`[boot] uncaughtException: ${err?.stack || err}\n`);
  process.exit(1);
});
process.on('unhandledRejection', (err) => {
  process.stderr.write(`[boot] unhandledRejection: ${err instanceof Error ? err.stack : String(err)}\n`);
  process.exit(1);
});

import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { config } from './config.js';
import { logger } from './logger.js';
import { healthRoutes } from './routes/health.js';
import { priceRoutes } from './routes/prices.js';
import { commodityRoutes } from './routes/commodities.js';
import { authRoutes } from './routes/auth.js';
import { watchlistRoutes } from './routes/watchlist.js';
import { deviceRoutes } from './routes/devices.js';
import { marketRoutes } from './routes/markets.js';
import { listingRoutes } from './routes/listings.js';
import { buyerRoutes } from './routes/buyers.js';
import { transportRoutes } from './routes/transport.js';
import { subscriptionRoutes } from './routes/subscriptions.js';
import { weatherRoutes } from './routes/weather.js';
import { askRoutes } from './routes/ask.js';
import { registerPremiumMiddleware } from './middleware/premium.js';
import { startScraperCron } from './scraper/cron.js';
import { startDigestCron } from './notifications/digest.js';
import { startAdvisoryCron } from './notifications/advisories.js';
import { initSentry, captureException } from './observability/sentry.js';
import { shutdownAnalytics } from './observability/analytics.js';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string };
    user: { sub: string };
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: any, reply: any) => Promise<void>;
  }
}

async function build() {
  await initSentry();

  const app = Fastify({
    logger,
    trustProxy: true,
    disableRequestLogging: !config.isDev,
  });

  // Capture raw body for webhook signature verification.
  app.addContentTypeParser(
    'application/json',
    { parseAs: 'string' },
    (req: any, body: any, done: any) => {
      req.rawBody = body;
      try {
        done(null, body.length > 0 ? JSON.parse(body) : {});
      } catch (err) {
        done(err);
      }
    },
  );

  await app.register(cors, { origin: true });
  await app.register(rateLimit, {
    max: 120,
    timeWindow: '1 minute',
    allowList: (req) => req.url?.startsWith('/health') ?? false,
  });
  await app.register(jwt, { secret: config.jwtSecret });

  app.decorate('authenticate', async (req: any, reply: any) => {
    try {
      await req.jwtVerify();
      req.userId = req.user.sub;
    } catch {
      reply.code(401).send({ error: 'unauthorized' });
    }
  });
  // `any`-cast sidesteps Fastify's over-generic type parameters that drift
  // slightly between @fastify/* plugin versions — runtime is identical.
  registerPremiumMiddleware(app as any);

  app.setErrorHandler((err, _req, reply) => {
    captureException(err);
    logger.error({ err }, 'request error');
    reply.code(err.statusCode ?? 500).send({ error: err.message || 'internal_error' });
  });

  await app.register(healthRoutes);
  await app.register(async (scope) => {
    await scope.register(priceRoutes);
    await scope.register(commodityRoutes);
    await scope.register(authRoutes);
    await scope.register(watchlistRoutes);
    await scope.register(deviceRoutes);
    await scope.register(marketRoutes);
    await scope.register(listingRoutes);
    await scope.register(buyerRoutes);
    await scope.register(transportRoutes);
    await scope.register(subscriptionRoutes);
    await scope.register(weatherRoutes);
    await scope.register(askRoutes);
  }, { prefix: '/api' });

  app.setNotFoundHandler((_req, reply) => {
    reply.code(404).send({ error: 'not found' });
  });

  return app;
}

async function main() {
  process.stdout.write('[boot] main() starting build\n');
  const app = await build();
  process.stdout.write(`[boot] build complete, listening on port ${config.port}\n`);
  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
    process.stdout.write(`[boot] listen ok on 0.0.0.0:${config.port}\n`);
  } catch (err) {
    process.stderr.write(`[boot] listen failed: ${err instanceof Error ? err.stack : String(err)}\n`);
    logger.error({ err }, 'failed to start');
    process.exit(1);
  }

  if (config.scraperEnabled) startScraperCron();
  startDigestCron();
  startAdvisoryCron();

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'shutting down');
    await app.close();
    await shutdownAnalytics();
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  process.stderr.write(`[boot] main() threw: ${err instanceof Error ? err.stack : String(err)}\n`);
  process.exit(1);
});
