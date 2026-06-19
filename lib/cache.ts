type CacheEntry<T> = {
  value: T;
  expiry: number;
};

export class RouteCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private maxKeys: number;
  private ttlMs: number;

  constructor(maxKeys = 1000, ttlMs = 24 * 60 * 60 * 1000) {
    this.cache = new Map();
    this.maxKeys = maxKeys;
    this.ttlMs = ttlMs;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxKeys) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttlMs
    });
  }

  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    return this.cache.size;
  }
}

export const routeCache = new RouteCache<any>();
