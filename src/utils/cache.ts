/**
 * Generic IndexedDB Cache Utility
 * 
 * Provides a simple, modular caching layer using IndexedDB for web.
 * Supports TTL (time-to-live) for automatic cache expiration.
 * 
 * Can be used for any API responses, computed data, or other cacheable content.
 * 
 * @example
 * // Cache an API response
 * await setCache('api/users/123', userData, 60 * 60 * 1000); // 1 hour
 * const cached = await getCache('api/users/123');
 * 
 * @example
 * // Cache with custom TTL
 * await setCache('computed-data', expensiveComputation(), CACHE_TTL.SHORT);
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheDBSchema extends DBSchema {
  cache: {
    key: string;
    value: CacheEntry<any>;
  };
}

let dbPromise: Promise<IDBPDatabase<CacheDBSchema>> | null = null;
let dbName: string = 'app-cache';

/**
 * Initialize the IndexedDB database
 * 
 * @param name - Optional database name (default: 'app-cache')
 */
const initDB = (name?: string): Promise<IDBPDatabase<CacheDBSchema>> => {
  if (name) {
    dbName = name;
  }
  
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = openDB<CacheDBSchema>(dbName, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache');
      }
    },
  });

  return dbPromise;
};

/**
 * Check if IndexedDB is available (web environment)
 */
const isIndexedDBAvailable = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  return 'indexedDB' in window;
};

/**
 * Get a cached value (even if expired)
 * 
 * @param key - Cache key
 * @param allowExpired - If true, return expired entries instead of deleting them (default: false)
 * @returns Cached data or null if not found (or expired if allowExpired is false)
 */
export const getCache = async <T>(key: string, allowExpired: boolean = false): Promise<T | null> => {
  if (!isIndexedDBAvailable()) {
    return null;
  }

  try {
    const db = await initDB();
    const entry = await db.get('cache', key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    const now = Date.now();
    const age = now - entry.timestamp;

    if (age > entry.ttl) {
      if (allowExpired) {
        // Return expired entry for fallback purposes
        return entry.data as T;
      } else {
        // Entry expired, delete it
        await db.delete('cache', key);
        return null;
      }
    }

    return entry.data as T;
  } catch (error) {
    console.warn('Cache get error:', error);
    return null;
  }
};

/**
 * Set a cached value
 * 
 * Stores data in the cache with an optional TTL (time-to-live).
 * If TTL is not provided, defaults to 1 hour.
 * 
 * @param key - Cache key
 * @param data - Data to cache (any serializable value)
 * @param ttl - Time to live in milliseconds (default: 1 hour)
 * 
 * @example
 * // Cache with default TTL (1 hour)
 * await setCache('api/users/123', userData);
 * 
 * @example
 * // Cache with custom TTL
 * await setCache('api/users/123', userData, CACHE_TTL.SHORT);
 * 
 * @example
 * // Cache with custom TTL in milliseconds
 * await setCache('computed-result', result, 5 * 60 * 1000); // 5 minutes
 */
export const setCache = async <T>(
  key: string,
  data: T,
  ttl: number = CACHE_TTL.LONG // 1 hour default
): Promise<void> => {
  if (!isIndexedDBAvailable()) {
    return;
  }

  try {
    const db = await initDB();
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    await db.put('cache', entry, key);
  } catch (error) {
    console.warn('Cache set error:', error);
  }
};

/**
 * Delete a cached value
 * 
 * @param key - Cache key to delete
 * 
 * @example
 * await deleteCache('api/users/123');
 */
export const deleteCache = async (key: string): Promise<void> => {
  if (!isIndexedDBAvailable()) {
    return;
  }

  try {
    const db = await initDB();
    await db.delete('cache', key);
  } catch (error) {
    console.warn('Cache delete error:', error);
  }
};

/**
 * Clear all cached values
 * 
 * Useful for cache invalidation or cleanup.
 * 
 * @example
 * // Clear all cache on logout
 * await clearCache();
 */
export const clearCache = async (): Promise<void> => {
  if (!isIndexedDBAvailable()) {
    return;
  }

  try {
    const db = await initDB();
    await db.clear('cache');
  } catch (error) {
    console.warn('Cache clear error:', error);
  }
};

/**
 * Check if a key exists in cache (without retrieving the value)
 * 
 * @param key - Cache key to check
 * @returns true if key exists and is not expired, false otherwise
 * 
 * @example
 * if (await hasCache('api/users/123')) {
 *   // Cache exists
 * }
 */
export const hasCache = async (key: string): Promise<boolean> => {
  if (!isIndexedDBAvailable()) {
    return false;
  }

  try {
    const db = await initDB();
    const entry = await db.get('cache', key);

    if (!entry) {
      return false;
    }

    // Check if entry has expired
    const now = Date.now();
    const age = now - entry.timestamp;

    if (age > entry.ttl) {
      // Entry expired, delete it
      await db.delete('cache', key);
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Cache has error:', error);
    return false;
  }
};

/**
 * Cached fetch utility
 * 
 * Automatically caches fetch responses based on URL and freshness.
 * Returns cached data if available and fresh, otherwise fetches and caches the response.
 * 
 * @param url - URL to fetch
 * @param options - Fetch options (same as native fetch)
 * @param freshness - How long to consider cached data fresh (in milliseconds, default: 1 hour)
 * @returns Promise resolving to the response data (parsed JSON)
 * 
 * @example
 * // Fetch with default 1 hour cache
 * const data = await cachedFetch('https://api.example.com/users');
 * 
 * @example
 * // Fetch with custom freshness (5 minutes)
 * const data = await cachedFetch('https://api.example.com/users', {}, 5 * 60 * 1000);
 * 
 * @example
 * // Fetch with custom headers
 * const data = await cachedFetch('https://api.example.com/users', {
 *   headers: { 'Authorization': 'Bearer token' }
 * }, CACHE_TTL.SHORT);
 */
export const cachedFetch = async <T = any>(
  url: string,
  options: RequestInit = {},
  freshness: number = CACHE_TTL.LONG
): Promise<T> => {
  // Generate cache key from URL and options
  // Include method and auth status in key to differentiate requests
  const cacheKeyParams: Record<string, string> = {
    method: options.method || 'GET',
  };
  
  const hasAuth = options.headers && (
    (options.headers as Record<string, string>)['Authorization'] || 
    (options.headers as Record<string, string>)['authorization']
  );
  
  // Include auth in cache key if present (different tokens = different responses)
  if (hasAuth) {
    // Don't include full token in key for security, just mark as authenticated
    cacheKeyParams.auth = 'true';
  }
  
  // For POST/PUT/PATCH requests, include body hash in cache key
  // This is important for GraphQL and other POST requests where body affects response
  if (options.body && (options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH')) {
    // Create a hash of the body for the cache key
    // For strings, use them directly; for other types, stringify
    let bodyString: string;
    if (typeof options.body === 'string') {
      bodyString = options.body;
    } else if (options.body instanceof FormData || options.body instanceof URLSearchParams) {
      // For FormData/URLSearchParams, we can't easily hash, so use a placeholder
      // In practice, these are rarely cached anyway
      bodyString = 'form-data';
    } else {
      bodyString = JSON.stringify(options.body);
    }
    
    // Create a simple hash: use a combination of length and content
    // This helps avoid collisions while keeping keys reasonable
    // For short bodies, use the full body; for long ones, use first 100 chars + length
    const bodyHash = bodyString.length <= 100
      ? bodyString
      : `${bodyString.substring(0, 100)}_len${bodyString.length}`;
    
    // Use the hash in the cache key (truncate to 200 chars max for key size)
    cacheKeyParams.body = bodyHash.length > 200 ? bodyHash.substring(0, 200) : bodyHash;
  }
  
  const cacheKey = getCacheKey(url, cacheKeyParams);

  // Check cache first with current auth status
  const cached = await getCache<T>(cacheKey);
  if (cached !== null) {
    console.log(`[cachedFetch] Cache HIT for ${url.substring(0, 50)}...`);
    return cached;
  }
  
  console.log(`[cachedFetch] Cache MISS for ${url.substring(0, 50)}... (key: ${cacheKey.substring(0, 80)}...)`);

  // If cache miss, try alternate auth status for public endpoints
  // (public GitHub API endpoints return same data regardless of auth)
  // Only do this for GET requests (POST requests with bodies are unique)
  if (!options.body && (options.method === 'GET' || !options.method)) {
    const alternateKeyParams: Record<string, string> = {
      method: options.method || 'GET',
    };
    if (!hasAuth) {
      alternateKeyParams.auth = 'true';
    }
    const alternateCacheKey = getCacheKey(url, alternateKeyParams);
    const alternateCached = await getCache<T>(alternateCacheKey);
    if (alternateCached !== null) {
      console.log('[cachedFetch] Using cached data with alternate auth status');
      return alternateCached;
    }
  }

  // Cache miss - fetch from network
  let response: Response;
  try {
    response = await fetch(url, options);
  } catch (fetchError) {
    // If fetch fails, try to get cached data (including expired) with alternate auth status
    // This helps when auth errors occur but we have cached data from previous requests
    if (hasAuth) {
      // Try cache without auth (including expired)
      const noAuthKey = getCacheKey(url, { method: options.method || 'GET' });
      const noAuthCached = await getCache<T>(noAuthKey, true); // allowExpired = true
      if (noAuthCached !== null) {
        console.log('[cachedFetch] Using cached data (no auth, may be expired) after fetch error');
        return noAuthCached;
      }
    } else {
      // Try cache with auth (including expired)
      const authKey = getCacheKey(url, { method: options.method || 'GET', auth: 'true' });
      const authCached = await getCache<T>(authKey, true); // allowExpired = true
      if (authCached !== null) {
        console.log('[cachedFetch] Using cached data (with auth, may be expired) after fetch error');
        return authCached;
      }
    }
    
    // Also try current cache key with expired entries allowed
    const currentCached = await getCache<T>(cacheKey, true); // allowExpired = true
    if (currentCached !== null) {
      console.log('[cachedFetch] Using cached data (may be expired) after fetch error');
      return currentCached;
    }
    
    throw fetchError;
  }

  if (!response.ok) {
    const statusCode = response.status;
    // For 401/402 or any error status, try to get cached data (including expired) with alternate auth status
    // This ensures we use cached data if available, even if expired, when the request fails
    if (hasAuth) {
      // Try cache without auth (including expired)
      const noAuthKey = getCacheKey(url, { method: options.method || 'GET' });
      const noAuthCached = await getCache<T>(noAuthKey, true); // allowExpired = true
      if (noAuthCached !== null) {
        console.log(`[cachedFetch] Using cached data (no auth, may be expired) after ${statusCode} error`);
        return noAuthCached;
      }
    } else {
      // Try cache with auth (including expired)
      const authKey = getCacheKey(url, { method: options.method || 'GET', auth: 'true' });
      const authCached = await getCache<T>(authKey, true); // allowExpired = true
      if (authCached !== null) {
        console.log(`[cachedFetch] Using cached data (with auth, may be expired) after ${statusCode} error`);
        return authCached;
      }
    }
    
    // Also try current cache key with expired entries allowed
    const currentCached = await getCache<T>(cacheKey, true); // allowExpired = true
    if (currentCached !== null) {
      console.log(`[cachedFetch] Using cached data (may be expired) after ${statusCode} error`);
      return currentCached;
    }
    
    // Only throw error if we have NO cached data available (even expired)
    throw new Error(`HTTP ${statusCode}: ${response.statusText}`);
  }

  // Parse response (assuming JSON)
  const data = await response.json() as T;

  // Cache the response
  await setCache(cacheKey, data, freshness);
  console.log(`[cachedFetch] Cached response for ${url.substring(0, 50)}... (TTL: ${freshness}ms)`);

  return data;
};

/**
 * Generate a cache key from a base key and optional parameters
 * 
 * Useful for creating consistent cache keys for API requests or computed data.
 * 
 * @param baseKey - Base cache key (e.g., 'api/users' or 'github:repos')
 * @param params - Optional parameters to include in the key
 * @returns A normalized cache key string
 * 
 * @example
 * getCacheKey('api/users', { id: 123, include: 'profile' })
 * // Returns: 'api/users?id=123&include=profile'
 */
export const getCacheKey = (
  baseKey: string,
  params?: Record<string, string | number | boolean>
): string => {
  if (!params || Object.keys(params).length === 0) {
    return baseKey;
  }
  const paramString = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${String(value)}`)
    .join('&');
  return `${baseKey}?${paramString}`;
};

/**
 * Cache TTL constants (in milliseconds)
 * 
 * Predefined time-to-live values for common caching scenarios.
 * Use these constants or provide custom TTL values in milliseconds.
 */
export const CACHE_TTL = {
  // Short-term cache (5 minutes)
  SHORT: 5 * 60 * 1000,
  
  // Medium-term cache (30 minutes)
  MEDIUM: 30 * 60 * 1000,
  
  // Long-term cache (1 hour)
  LONG: 60 * 60 * 1000,
  
  // Very long-term cache (24 hours)
  VERY_LONG: 24 * 60 * 60 * 1000,
  
  // Specific use cases (for backward compatibility and convenience)
  USER_PROFILE: 60 * 60 * 1000, // 1 hour
  USER_REPOS: 30 * 60 * 1000, // 30 minutes
  REPO_DETAILS: 60 * 60 * 1000, // 1 hour
  GITHUB_PAGES: 24 * 60 * 60 * 1000, // 24 hours
} as const;

/**
 * Initialize the cache system
 * 
 * Call this once at app startup if you want to use a custom database name.
 * Otherwise, the cache will auto-initialize on first use.
 * 
 * @param name - Optional database name (default: 'app-cache')
 * 
 * @example
 * // Initialize with custom name
 * initCache('my-app-cache');
 */
export const initCache = (name?: string): Promise<void> => {
  return initDB(name).then(() => undefined);
};

