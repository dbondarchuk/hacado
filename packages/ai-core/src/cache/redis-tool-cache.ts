export type ToolResultCache = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
};

export const DEFAULT_TOOL_CACHE_TTL_SECONDS = 45;

export async function withToolCache<T>(input: {
  cache?: ToolResultCache;
  key: string;
  ttlSeconds?: number;
  compute: () => T | Promise<T>;
}): Promise<T> {
  const ttl = input.ttlSeconds ?? DEFAULT_TOOL_CACHE_TTL_SECONDS;

  if (input.cache) {
    try {
      const hit = await input.cache.get(input.key);

      if (hit != null) {
        return JSON.parse(hit) as T;
      }
    } catch {
      // ignore cache read errors
    }
  }

  const value = await input.compute();

  if (input.cache) {
    try {
      await input.cache.set(input.key, JSON.stringify(value), ttl);
    } catch {
      // ignore cache write errors
    }
  }

  return value;
}
