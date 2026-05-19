interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

const inMemoryCache = new Map<string, CacheEntry<unknown>>();

export async function getCachedValue<T>({
  key,
  ttlMs,
  fetcher,
}: {
  key: string;
  ttlMs: number;
  fetcher: () => Promise<T>;
}): Promise<T> {
  const now = Date.now();
  const cachedValue = inMemoryCache.get(key) as CacheEntry<T> | undefined;

  if (cachedValue && cachedValue.expiresAt > now) {
    return cachedValue.value;
  }

  const value = await fetcher();
  inMemoryCache.set(key, {
    value,
    expiresAt: now + ttlMs,
  });

  return value;
}

export function clearInMemoryCache(prefix?: string): void {
  if (!prefix) {
    inMemoryCache.clear();
    return;
  }

  for (const key of inMemoryCache.keys()) {
    if (key.startsWith(prefix)) {
      inMemoryCache.delete(key);
    }
  }
}
