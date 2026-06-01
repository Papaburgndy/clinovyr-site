import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export type HealthStatus = "ok" | "degraded" | "error";

export type HealthResponse = {
  status: HealthStatus;
  checks: {
    filesystem: boolean;
    env: Record<string, boolean>;
    anthropicKeyFormat: boolean;
  };
};

const defaultDataDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../data",
);

function envPresence(keys: string[]): Record<string, boolean> {
  return Object.fromEntries(
    keys.map((key) => [key, Boolean(process.env[key]?.trim())]),
  );
}

function checkAnthropicKeyFormat(): boolean {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  return Boolean(key && key.startsWith("sk-ant-"));
}

function checkWritableDataDir(dataDir: string): boolean {
  try {
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
    const probe = join(dataDir, ".health-write-probe");
    writeFileSync(probe, "ok", "utf8");
    unlinkSync(probe);
    return true;
  } catch {
    return false;
  }
}

export function getHealthPayload(): {
  body: HealthResponse;
  statusCode: number;
} {
  const envKeys = [
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "REDIS_URL",
    "RESEND_API_KEY",
    "ESCALATION_QUEUE_PATH",
    "ANTHROPIC_API_KEY",
  ];
  const requiredEnvKeys = ["RESEND_API_KEY"];

  const dataDir = process.env.ESCALATION_QUEUE_PATH?.trim()
    ? dirname(process.env.ESCALATION_QUEUE_PATH)
    : defaultDataDir;

  const filesystem = checkWritableDataDir(dataDir);
  const env = envPresence(envKeys);
  const anthropicKeyFormat = checkAnthropicKeyFormat();

  const missingRequired = requiredEnvKeys.filter((key) => !env[key]);

  let status: HealthStatus = "ok";
  if (!filesystem || missingRequired.length > 0) {
    status = "error";
  } else if (env.ANTHROPIC_API_KEY && !anthropicKeyFormat) {
    status = "degraded";
  }

  return {
    body: {
      status,
      checks: { filesystem, env, anthropicKeyFormat },
    },
    statusCode: status === "error" ? 503 : 200,
  };
};
