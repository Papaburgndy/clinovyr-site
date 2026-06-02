import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import { createResendClient } from "./lib/resend.js";

function loadEnvLocal(): void {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  for (const rel of [".env.local", "../../.env.local"]) {
    const envPath = join(root, rel);
    if (!existsSync(envPath)) continue;
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      if (process.env[key]) continue;
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
    break;
  }
}

loadEnvLocal();
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
