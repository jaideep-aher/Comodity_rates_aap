import type { FastifyInstance } from 'fastify';
import { config } from '../config.js';

const DEFAULT_PLAY =
  'https://play.google.com/store/apps/details?id=com.agro.agrofix';

export async function clientConfigRoutes(app: FastifyInstance) {
  app.get('/client-config', async () => {
    const min = config.minAppVersion?.trim();
    const max = config.maxAppVersion?.trim();
    return {
      minAppVersion: min && min.length > 0 ? min : null,
      maxAppVersion: max && max.length > 0 ? max : null,
      otpVerificationEnabled: config.otpVerificationEnabled,
      androidStoreUrl: config.androidStoreUrl?.trim() || DEFAULT_PLAY,
      iosStoreUrl: config.iosStoreUrl?.trim() || null,
    };
  });
}
