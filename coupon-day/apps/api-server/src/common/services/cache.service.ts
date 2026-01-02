import Redis from 'ioredis';
import { env } from '../../config/env.js';

/**
 * Redis Cache Service
 * PRD 9.1 - API 응답 캐싱 (캐시 히트율 80% 목표)
 */

type CacheOptions = {
  ttl?: number; // seconds
  tags?: string[]; // for cache invalidation
};

const DEFAULT_TTL = 300; // 5 minutes

class CacheService {
  private client: Redis | null = null;
  private memoryCache: Map<string, { value: string; expiresAt: number }> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();

  // Stats for monitoring
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
  };

  constructor() {
    if (env.REDIS_URL) {
      this.client = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      this.client.on('error', (err) => {
        console.error('[Cache] Redis connection error:', err.message);
        // Fall back to in-memory cache
        this.client = null;
      });

      this.client.on('connect', () => {
        console.log('[Cache] Redis connected');
      });
    } else {
      console.log('[Cache] REDIS_URL not set, using in-memory cache');
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      let value: string | null = null;

      if (this.client) {
        value = await this.client.get(key);
      } else {
        const cached = this.memoryCache.get(key);
        if (cached && cached.expiresAt > Date.now()) {
          value = cached.value;
        } else if (cached) {
          this.memoryCache.delete(key);
        }
      }

      if (value) {
        this.stats.hits++;
        return JSON.parse(value) as T;
      }

      this.stats.misses++;
      return null;
    } catch (error) {
      console.error('[Cache] Get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl ?? DEFAULT_TTL;
    const serialized = JSON.stringify(value);

    try {
      if (this.client) {
        await this.client.setex(key, ttl, serialized);

        // Handle tags for Redis
        if (options.tags) {
          for (const tag of options.tags) {
            await this.client.sadd(`tag:${tag}`, key);
            await this.client.expire(`tag:${tag}`, ttl * 2); // Tag lives longer than cached items
          }
        }
      } else {
        this.memoryCache.set(key, {
          value: serialized,
          expiresAt: Date.now() + ttl * 1000,
        });

        // Handle tags for memory cache
        if (options.tags) {
          for (const tag of options.tags) {
            if (!this.tagIndex.has(tag)) {
              this.tagIndex.set(tag, new Set());
            }
            this.tagIndex.get(tag)!.add(key);
          }
        }
      }

      this.stats.sets++;
    } catch (error) {
      console.error('[Cache] Set error:', error);
    }
  }

  /**
   * Delete specific key
   */
  async delete(key: string): Promise<void> {
    try {
      if (this.client) {
        await this.client.del(key);
      } else {
        this.memoryCache.delete(key);
      }
      this.stats.deletes++;
    } catch (error) {
      console.error('[Cache] Delete error:', error);
    }
  }

  /**
   * Invalidate all keys with given tag
   */
  async invalidateByTag(tag: string): Promise<void> {
    try {
      if (this.client) {
        const keys = await this.client.smembers(`tag:${tag}`);
        if (keys.length > 0) {
          await this.client.del(...keys);
          await this.client.del(`tag:${tag}`);
        }
      } else {
        const keys = this.tagIndex.get(tag);
        if (keys) {
          for (const key of keys) {
            this.memoryCache.delete(key);
          }
          this.tagIndex.delete(tag);
        }
      }
    } catch (error) {
      console.error('[Cache] Invalidate by tag error:', error);
    }
  }

  /**
   * Invalidate keys matching pattern
   */
  async invalidateByPattern(pattern: string): Promise<void> {
    try {
      if (this.client) {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } else {
        const regex = new RegExp(pattern.replace('*', '.*'));
        for (const key of this.memoryCache.keys()) {
          if (regex.test(key)) {
            this.memoryCache.delete(key);
          }
        }
      }
    } catch (error) {
      console.error('[Cache] Invalidate by pattern error:', error);
    }
  }

  /**
   * Get or set pattern (cache-aside)
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetcher();
    await this.set(key, value, options);
    return value;
  }

  /**
   * Get cache stats
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? (this.stats.hits / total * 100).toFixed(2) + '%' : '0%',
      isRedis: !!this.client,
    };
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      if (this.client) {
        await this.client.flushdb();
      } else {
        this.memoryCache.clear();
        this.tagIndex.clear();
      }
    } catch (error) {
      console.error('[Cache] Clear error:', error);
    }
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
    }
  }
}

// Singleton instance
export const cache = new CacheService();

// Cache key generators
export const cacheKeys = {
  // Customer endpoints
  nearbyCoupons: (lat: number, lng: number, radius: number) =>
    `coupons:nearby:${lat.toFixed(4)}:${lng.toFixed(4)}:${radius}`,
  couponDetail: (id: string) => `coupon:${id}`,
  storeDetail: (id: string) => `store:${id}`,
  storeMenu: (storeId: string) => `store:${storeId}:menu`,

  // Store endpoints
  storeDashboard: (storeId: string) => `store:${storeId}:dashboard`,
  storePartnerships: (storeId: string) => `store:${storeId}:partnerships`,
  partnerRecommendations: (storeId: string) => `store:${storeId}:partner-recommendations`,
  crossCouponStats: (storeId: string, couponId: string) =>
    `store:${storeId}:cross-coupon:${couponId}:stats`,

  // Categories
  categories: () => 'categories:all',
};

// Cache TTL presets (in seconds)
export const cacheTTL = {
  SHORT: 60,          // 1 minute - for frequently changing data
  MEDIUM: 300,        // 5 minutes - default
  LONG: 1800,         // 30 minutes - for stable data
  HOUR: 3600,         // 1 hour
  DAY: 86400,         // 24 hours - for rarely changing data
};
