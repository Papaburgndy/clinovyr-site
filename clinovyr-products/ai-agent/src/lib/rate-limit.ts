import type { RedisClient } from "../types.js";
import { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_SECONDS } from "../types.js";

function rateLimitKey(sessionId: string): string {
  return `ratelimit:${sessionId}`;
}

export async function checkRateLimit(
  redis: RedisClient,
  sessionId: string,
): Promise<{ allowed: boolean; count: number }> {
  const key = rateLimitKey(sessionId);
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, RATE_LIMIT_WINDOW_SECONDS);
  }
  return {
    allowed: count <= RATE_LIMIT_MAX,
    count,
  };
}
