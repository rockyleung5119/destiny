import { CACHE_DURATIONS } from './constants';
import { generateCacheKey, safeJsonParse, safeJsonStringify } from './utils';
import prisma from './db';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

export class CacheService {
  private static instance: CacheService;
  private memoryCache: Map<string, { value: any; expiresAt: number }> = new Map();

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    const fullKey = options?.prefix ? generateCacheKey(options.prefix, key) : key;

    // Try memory cache first
    const memoryItem = this.memoryCache.get(fullKey);
    if (memoryItem && memoryItem.expiresAt > Date.now()) {
      return memoryItem.value;
    }

    // Try database cache
    try {
      const cacheEntry = await prisma.cache.findUnique({
        where: { key: fullKey }
      });

      if (cacheEntry && cacheEntry.expiresAt > new Date()) {
        const value = safeJsonParse(cacheEntry.value, null);
        
        // Store in memory cache for faster access
        this.memoryCache.set(fullKey, {
          value,
          expiresAt: cacheEntry.expiresAt.getTime()
        });

        return value;
      }
    } catch (error) {
      console.error('Cache get error:', error);
    }

    return null;
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, options?: CacheOptions): Promise<void> {
    const fullKey = options?.prefix ? generateCacheKey(options.prefix, key) : key;
    const ttl = options?.ttl || CACHE_DURATIONS.USER_PROFILE;
    const expiresAt = new Date(Date.now() + ttl * 1000);

    // Store in memory cache
    this.memoryCache.set(fullKey, {
      value,
      expiresAt: expiresAt.getTime()
    });

    // Store in database cache
    try {
      await prisma.cache.upsert({
        where: { key: fullKey },
        update: {
          value: safeJsonStringify(value),
          expiresAt
        },
        create: {
          key: fullKey,
          value: safeJsonStringify(value),
          expiresAt
        }
      });
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string, options?: CacheOptions): Promise<void> {
    const fullKey = options?.prefix ? generateCacheKey(options.prefix, key) : key;

    // Remove from memory cache
    this.memoryCache.delete(fullKey);

    // Remove from database cache
    try {
      await prisma.cache.delete({
        where: { key: fullKey }
      }).catch(() => {
        // Ignore if key doesn't exist
      });
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Clear all cache with prefix
   */
  async clear(prefix?: string): Promise<void> {
    if (prefix) {
      // Clear memory cache with prefix
      for (const key of this.memoryCache.keys()) {
        if (key.startsWith(prefix)) {
          this.memoryCache.delete(key);
        }
      }

      // Clear database cache with prefix
      try {
        await prisma.cache.deleteMany({
          where: {
            key: {
              startsWith: prefix
            }
          }
        });
      } catch (error) {
        console.error('Cache clear error:', error);
      }
    } else {
      // Clear all cache
      this.memoryCache.clear();
      
      try {
        await prisma.cache.deleteMany();
      } catch (error) {
        console.error('Cache clear error:', error);
      }
    }
  }

  /**
   * Get or set pattern
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const cached = await this.get<T>(key, options);
    
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options);
    
    return value;
  }

  /**
   * Clean expired entries
   */
  async cleanExpired(): Promise<void> {
    const now = Date.now();

    // Clean memory cache
    for (const [key, item] of this.memoryCache.entries()) {
      if (item.expiresAt <= now) {
        this.memoryCache.delete(key);
      }
    }

    // Clean database cache
    try {
      await prisma.cache.deleteMany({
        where: {
          expiresAt: {
            lte: new Date()
          }
        }
      });
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    memoryEntries: number;
    databaseEntries: number;
    memorySize: number;
  }> {
    const memoryEntries = this.memoryCache.size;
    const memorySize = JSON.stringify([...this.memoryCache.entries()]).length;

    let databaseEntries = 0;
    try {
      databaseEntries = await prisma.cache.count();
    } catch (error) {
      console.error('Cache stats error:', error);
    }

    return {
      memoryEntries,
      databaseEntries,
      memorySize
    };
  }
}

// Export singleton instance
export const cache = CacheService.getInstance();

// Cache key generators for different types
export const CacheKeys = {
  userProfile: (userId: string) => generateCacheKey('user', userId),
  baziAnalysis: (birthDate: string, birthPlace: string) => 
    generateCacheKey('bazi', birthDate, birthPlace),
  dailyFortune: (date: string, userId: string) => 
    generateCacheKey('daily', date, userId),
  aiResponse: (prompt: string) => 
    generateCacheKey('ai', Buffer.from(prompt).toString('base64').slice(0, 50)),
  systemConfig: (key: string) => 
    generateCacheKey('config', key)
};

// Helper functions for common cache operations
export async function getCachedUserProfile(userId: string) {
  return cache.get(CacheKeys.userProfile(userId), {
    ttl: CACHE_DURATIONS.USER_PROFILE
  });
}

export async function setCachedUserProfile(userId: string, profile: any) {
  return cache.set(CacheKeys.userProfile(userId), profile, {
    ttl: CACHE_DURATIONS.USER_PROFILE
  });
}

export async function getCachedBaziAnalysis(birthDate: string, birthPlace: string) {
  return cache.get(CacheKeys.baziAnalysis(birthDate, birthPlace), {
    ttl: CACHE_DURATIONS.BAZI_CALCULATION
  });
}

export async function setCachedBaziAnalysis(
  birthDate: string, 
  birthPlace: string, 
  analysis: any
) {
  return cache.set(CacheKeys.baziAnalysis(birthDate, birthPlace), analysis, {
    ttl: CACHE_DURATIONS.BAZI_CALCULATION
  });
}

export async function getCachedDailyFortune(date: string, userId: string) {
  return cache.get(CacheKeys.dailyFortune(date, userId), {
    ttl: CACHE_DURATIONS.DAILY_FORTUNE
  });
}

export async function setCachedDailyFortune(date: string, userId: string, fortune: any) {
  return cache.set(CacheKeys.dailyFortune(date, userId), fortune, {
    ttl: CACHE_DURATIONS.DAILY_FORTUNE
  });
}
