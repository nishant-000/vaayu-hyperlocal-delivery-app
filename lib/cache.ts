import { CustomAsyncStorage } from './supabase'

interface CacheItem<T> {
  data: T
  timestamp: number
  ttlMs: number
}

const memoryCache = new Map<string, CacheItem<any>>()

/**
 * Instant 0ms synchronous in-memory cache lookup
 */
export function getCacheSync<T>(key: string): T | null {
  const item = memoryCache.get(key)
  if (!item) return null
  if (Date.now() - item.timestamp > item.ttlMs) {
    memoryCache.delete(key)
    return null
  }
  return item.data
}

/**
 * Asynchronous cache lookup (checks in-memory first, then persistent storage)
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const syncResult = getCacheSync<T>(key)
  if (syncResult !== null) return syncResult

  try {
    const raw = await CustomAsyncStorage.getItem(`cache_${key}`)
    if (!raw) return null
    const parsed: CacheItem<T> = JSON.parse(raw)
    if (Date.now() - parsed.timestamp > parsed.ttlMs) {
      CustomAsyncStorage.removeItem(`cache_${key}`)
      return null
    }
    memoryCache.set(key, parsed)
    return parsed.data
  } catch (e) {
    return null
  }
}

/**
 * Stores data in both in-memory cache and persistent storage
 */
export async function setCache<T>(key: string, data: T, ttlSeconds = 300): Promise<void> {
  const item: CacheItem<T> = {
    data,
    timestamp: Date.now(),
    ttlMs: ttlSeconds * 1000
  }
  memoryCache.set(key, item)
  try {
    await CustomAsyncStorage.setItem(`cache_${key}`, JSON.stringify(item))
  } catch (e) {
    // Ignore storage errors
  }
}

/**
 * Clears a specific cache key
 */
export async function clearCache(key: string): Promise<void> {
  memoryCache.delete(key)
  try {
    await CustomAsyncStorage.removeItem(`cache_${key}`)
  } catch (e) {}
}

/**
 * Completely purges all in-memory and persistent user-specific cache keys on logout
 */
export async function clearAllUserCache(): Promise<void> {
  memoryCache.clear()
  try {
    // Clear common known cache keys from persistent storage
    const knownKeys = [
      'user_orders',
      'owner_orders',
      'owner_menu',
      'campus_shops'
    ]
    for (const k of knownKeys) {
      await CustomAsyncStorage.removeItem(`cache_${k}`)
    }
  } catch (e) {}
}
