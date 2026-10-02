// In-memory cache for parsed localStorage JSON items to avoid redundant blocking JSON.parse calls during renders
const cache = new Map<string, { raw: string | null; parsed: any }>();

export function getCachedLocalStorage<T = any>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      cache.delete(key);
      return defaultValue;
    }
    const cached = cache.get(key);
    if (cached && cached.raw === raw) {
      return cached.parsed as T;
    }
    const parsed = JSON.parse(raw);
    cache.set(key, { raw, parsed });
    return parsed as T;
  } catch {
    return defaultValue;
  }
}

export function setCachedLocalStorage(key: string, value: any): void {
  try {
    const raw = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, raw);
    cache.set(key, { raw, parsed: value });
  } catch (e) {
    console.error(`[storageCache] Error setting item for key "${key}":`, e);
  }
}

export function invalidateStorageCache(key?: string): void {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}
