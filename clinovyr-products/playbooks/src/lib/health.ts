import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type HealthStatus = "ok" | "degraded" | "error";

type HealthResponse = {
  status: HealthStatus;
  checks: {
    filesystem: boolean;
    env: Record<string, boolean>;
    anthropicKeyFormat: boolean;
  };
};

type HealthConfig = {
  dataDir: string;
  envKeys: string[];
  requiredEnvKeys: string[];
  anthropicOptional?: boolean;
};

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

function buildHealthResponse(config: HealthConfig): {
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

  return {
    body: {
      status,
      checks: { filesystem, env, anthropicKeyFormat },
    },
    statusCode: status === "error" ? 503 : 200,
  };
}

export function getPlaybooksHealth() {
  return buildHealthResponse({
    dataDir: join(process.cwd(), "data"),
    envKeys: [
      "ANTHROPIC_API_KEY",
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
      "RESEND_API_KEY",
      "RESEND_FROM_EMAIL",
      "SITE_URL",
      "NEXT_PUBLIC_SITE_URL",
    ],
    requiredEnvKeys: [
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "RESEND_API_KEY",
      "SITE_URL",
    ],
  });
}
