/**
 * Shared health-check utilities (reference).
 * Per-app implementations live in each project's `src/lib/health.ts`.
 */
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type HealthStatus = "ok" | "degraded" | "error";

export type HealthChecks = {
  filesystem: boolean;
  env: Record<string, boolean>;
  anthropicKeyFormat: boolean;
};

export type HealthResponse = {
  status: HealthStatus;
  checks: HealthChecks;
};

export type HealthConfig = {
  dataDir: string;
  envKeys: string[];
  /** Env vars that must be set for status "ok" (503 when missing). */
  requiredEnvKeys: string[];
  /** When true, missing or invalid Anthropic key yields "degraded" instead of "error". */
  anthropicOptional?: boolean;
};

export function envPresence(keys: string[]): Record<string, boolean> {
  return Object.fromEntries(
    keys.map((key) => [key, Boolean(process.env[key]?.trim())]),
  );
}

export function checkAnthropicKeyFormat(): boolean {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  return Boolean(key && key.startsWith("sk-ant-"));
}

export function checkWritableDataDir(dataDir: string): boolean {
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

export function buildHealthResponse(config: HealthConfig): {
  body: HealthResponse;
  statusCode: number;
} {
  const filesystem = checkWritableDataDir(config.dataDir);
  const env = envPresence(config.envKeys);
  const anthropicKeyFormat = checkAnthropicKeyFormat();

  const missingRequired = config.requiredEnvKeys.filter((key) => !env[key]);
  const anthropicRequired = config.envKeys.includes("ANTHROPIC_API_KEY");
  const anthropicIssue =
    anthropicRequired && env.ANTHROPIC_API_KEY && !anthropicKeyFormat;

  let status: HealthStatus = "ok";

  if (!filesystem || missingRequired.length > 0) {
    status = "error";
  } else if (
    anthropicIssue ||
    (anthropicRequired &&
      !config.anthropicOptional &&
      !env.ANTHROPIC_API_KEY)
  ) {
    status = "degraded";
  } else if (
    anthropicRequired &&
    config.anthropicOptional &&
    !env.ANTHROPIC_API_KEY
  ) {
    status = "degraded";
  }

  const statusCode = status === "error" ? 503 : 200;

  return {
    body: {
      status,
      checks: {
        filesystem,
        env,
        anthropicKeyFormat,
      },
    },
    statusCode,
  };
}
