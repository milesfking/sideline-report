type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const memory = new Map<string, CacheEntry<unknown>>();

export function getCached<T>(key: string): T | null {
  const entry = memory.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memory.delete(key);
    return null;
  }
  return entry.value as T;
}

export function setCached<T>(key: string, value: T, ttlMs: number): T {
  memory.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export async function getOrSetCached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const hit = getCached<T>(key);
  if (hit !== null) return hit;
  const value = await loader();
  return setCached(key, value, ttlMs);
}

export const TTL = {
  players: 24 * 60 * 60 * 1000,
  nflState: 5 * 60 * 1000,
  schedule: 20 * 60 * 1000,
  report: 2 * 60 * 1000,
} as const;