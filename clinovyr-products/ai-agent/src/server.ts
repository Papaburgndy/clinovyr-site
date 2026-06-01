import { createApp } from "./app.js";
import { createResendClient } from "./lib/resend.js";
import {
  createMemoryRedis,
  createRedisClient,
  createUpstashRedisClient,
} from "./lib/redis.js";

const port = Number(process.env.PORT ?? 3100);
const redis =
  createUpstashRedisClient(
    process.env.UPSTASH_REDIS_REST_URL,
    process.env.UPSTASH_REDIS_REST_TOKEN,
  ) ??
  createRedisClient(process.env.REDIS_URL) ??
  createMemoryRedis();
const resend = createResendClient(process.env.RESEND_API_KEY);

const app = createApp({ redis, resend });

app.listen(port, () => {
  console.log(`Clinovyr AI agent listening on http://localhost:${port}`);
});
