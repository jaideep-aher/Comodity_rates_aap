import Redis from 'ioredis';
import { config } from './config.js';
import { logger } from './logger.js';

interface CacheBackend {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
  delPrefix(prefix: string): Promise<void>;
}

class MemoryCache implements CacheBackend {
  private store = new Map<string, { value: string; expiresAt: number }>();

  async get(key: string) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }
  async set(key: string, value: string, ttlSeconds: number) {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }
  async del(key: string) {
    this.store.delete(key);
  }
  async delPrefix(prefix: string) {
    for (const k of this.store.keys()) if (k.startsWith(prefix)) this.store.delete(k);
  }
}

class RedisCache implements CacheBackend {
  constructor(private client: Redis) {}
  async get(key: string) {
    return this.client.get(key);
  }
  async set(key: string, value: string, ttlSeconds: number) {
    await this.client.set(key, value, 'EX', ttlSeconds);
  }
  async del(key: string) {
    await this.client.del(key);
  }
  async delPrefix(prefix: string) {
    const stream = this.client.scanStream({ match: `${prefix}*`, count: 100 });
    for await (const keys of stream) {
      if (keys.length) await this.client.del(...keys);
    }
  }
}

let backend: CacheBackend;
if (config.redisUrl) {
  const client = new Redis(config.redisUrl, { maxRetriesPerRequest: 3, lazyConnect: false });
  client.on('error', (err) => logger.warn({ err: err.message }, 'redis error — falling back is possible'));
  backend = new RedisCache(client);
  logger.info('cache backend: redis');
} else {
  backend = new MemoryCache();
  logger.info('cache backend: in-memory (no REDIS_URL set)');
}

export const cache = backend;

export async function cached<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  const hit = await cache.get(key);
  if (hit) {
    try {
      return JSON.parse(hit) as T;
    } catch {
      await cache.del(key);
    }
  }
  const value = await loader();
  await cache.set(key, JSON.stringify(value), ttlSeconds);
  return value;
}
