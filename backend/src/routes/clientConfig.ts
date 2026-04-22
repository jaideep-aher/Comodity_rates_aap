import type { FastifyInstance } from 'fastify';
import { config } from '../config.js';

const DEFAULT_PLAY =
  'https://play.google.com/store/apps/details?id=com.bajarbhav.app';

export async function clientConfigRoutes(app: FastifyInstance) {
  app.get('/client-config', async () => {
    const min = config.minAppVersion?.trim();
    return {
      minAppVersion: min && min.length > 0 ? min : null,
      androidStoreUrl: config.androidStoreUrl?.trim() || DEFAULT_PLAY,
      iosStoreUrl: config.iosStoreUrl?.trim() || null,
    };
  });
}
