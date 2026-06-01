import { Redis as IORedis } from "ioredis";
import { Redis as UpstashRedis } from "@upstash/redis";
import type { RedisClient } from "../types.js";

export const REDIS_RETRY_OPTIONS = {
  retries: 3,
  backoff: (retryCount: number) => Math.exp(retryCount) * 50,
};

async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= REDIS_RETRY_OPTIONS.retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < REDIS_RETRY_OPTIONS.retries) {
        await new Promise((resolve) =>
          setTimeout(resolve, REDIS_RETRY_OPTIONS.backoff(attempt)),
        );
      }
    }
  }
  throw lastError;
}

export function wrapRedisWithRetry(client: RedisClient): RedisClient {
  return {
    get: (key) => withRetry(() => client.get(key)),
    set: (key, value, mode?, duration?) =>
      withRetry(() => client.set(key, value, mode, duration)),
    incr: (key) => withRetry(() => client.incr(key)),
    expire: (key, seconds) => withRetry(() => client.expire(key, seconds)),
    del: (key) => withRetry(() => client.del(key)),
    lpush: (key, ...values) => withRetry(() => client.lpush(key, ...values)),
    lrange: (key, start, stop) =>
      withRetry(() => client.lrange(key, start, stop)),
    ttl: (key) => withRetry(() => client.ttl(key)),
  };
}

function adaptIoredis(client: IORedis): RedisClient {
  return {
    get: (key) => client.get(key),
    set: (key, value, mode?, duration?) => {
      if (mode === "EX" && typeof duration === "number") {
        return client.set(key, value, "EX", duration);
      }
      return client.set(key, value);
    },
    incr: (key) => client.incr(key),
    expire: (key, seconds) => client.expire(key, seconds),
    del: (key) => client.del(key),
    lpush: (key, ...values) => client.lpush(key, ...values),
    lrange: (key, start, stop) => client.lrange(key, start, stop),
    ttl: (key) => client.ttl(key),
  };
}

function adaptUpstash(client: UpstashRedis): RedisClient {
  return {
    get: (key) => client.get<string>(key),
    set: async (key, value, mode?, duration?) => {
      if (mode === "EX" && typeof duration === "number") {
        await client.set(key, value, { ex: duration });
        return "OK";
      }
      await client.set(key, value);
      return "OK";
    },
    incr: (key) => client.incr(key),
    expire: (key, seconds) => client.expire(key, seconds),
    del: (key) => client.del(key),
    lpush: async (key, ...values) => {
      let length = 0;
      for (const value of values) {
        length = await client.lpush(key, value);
      }
      return length;
    },
    lrange: (key, start, stop) => client.lrange<string>(key, start, stop),
    ttl: (key) => client.ttl(key),
  };
}

export function createUpstashRedisClient(
  url?: string,
  token?: string,
): RedisClient | null {
  if (!url || !token) {
    return null;
  }
  const client = new UpstashRedis({
    url,
    token,
    retry: REDIS_RETRY_OPTIONS,
  });
  return wrapRedisWithRetry(adaptUpstash(client));
}

export function createRedisClient(url?: string): RedisClient | null {
  if (!url) {
    return null;
  }
  const client = new IORedis(url, {
    maxRetriesPerRequest: REDIS_RETRY_OPTIONS.retries,
    lazyConnect: true,
  });
  return wrapRedisWithRetry(adaptIoredis(client));
}

/** In-memory Redis for tests and local dev without Redis URL */
export function createMemoryRedis(): RedisClient {
  const store = new Map<string, string>();
  const lists = new Map<string, string[]>();
  const expirations = new Map<string, number>();

  function isExpired(key: string): boolean {
    const exp = expirations.get(key);
    if (exp === undefined) return false;
    if (Date.now() > exp) {
      store.delete(key);
      lists.delete(key);
      expirations.delete(key);
      return true;
    }
    return false;
  }

  return {
    async get(key: string) {
      if (isExpired(key)) return null;
      return store.get(key) ?? null;
    },
    async set(key, value, mode?, duration?) {
      if (isExpired(key)) {
        store.delete(key);
      }
      store.set(key, value);
      if (mode === "EX" && typeof duration === "number") {
        expirations.set(key, Date.now() + duration * 1000);
      }
      return "OK";
    },
    async incr(key: string) {
      if (isExpired(key)) store.delete(key);
      const current = parseInt(store.get(key) ?? "0", 10);
      const next = current + 1;
      store.set(key, String(next));
      return next;
    },
    async expire(key: string, seconds: number) {
      if (seconds <= 0) {
        expirations.set(key, Date.now() - 1);
        return 1;
      }
      expirations.set(key, Date.now() + seconds * 1000);
      return 1;
    },
    async del(key: string) {
      store.delete(key);
      lists.delete(key);
      expirations.delete(key);
      return 1;
    },
    async lpush(key: string, ...values: string[]) {
      if (isExpired(key)) lists.delete(key);
      const list = lists.get(key) ?? [];
      lists.set(key, [...values, ...list]);
      return lists.get(key)!.length;
    },
    async lrange(key: string, start: number, stop: number) {
      if (isExpired(key)) return [];
      const list = lists.get(key) ?? [];
      const end = stop < 0 ? list.length + stop + 1 : stop + 1;
      return list.slice(start, end);
    },
    async ttl(key: string) {
      if (!lists.has(key) && !store.has(key)) return -2;
      const exp = expirations.get(key);
      if (!exp) return -1;
      const remaining = Math.ceil((exp - Date.now()) / 1000);
      return remaining > 0 ? remaining : -2;
    },
  };
}
