import { createApp } from "../src/app.js";
import { createResendClient } from "../src/lib/resend.js";
import {
  createMemoryRedis,
  createRedisClient,
  createUpstashRedisClient,
} from "../src/lib/redis.js";

const redis =
  createUpstashRedisClient(
    process.env.UPSTASH_REDIS_REST_URL,
    process.env.UPSTASH_REDIS_REST_TOKEN,
  ) ??
  createRedisClient(process.env.REDIS_URL) ??
  createMemoryRedis();

const resend = createResendClient(process.env.RESEND_API_KEY);
const app = createApp({ redis, resend });

export default app;
