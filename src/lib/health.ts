import { prisma } from "@/lib/prisma";

type CheckStatus = "ok" | "fail" | "skip";

type PortalHealthChecks = {
  database: CheckStatus;
  email: CheckStatus;
  stripe: CheckStatus;
  deliverables: CheckStatus;
};

export type PortalHealthResponse = {
  status: "ok" | "degraded";
  app: "clinovyr-portal";
  checks: PortalHealthChecks;
};

const DELIVERABLES_WORKER_NAME = "clinovyr-deliverables";
const DELIVERABLES_PING_TIMEOUT_MS = 800;

function envSet(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

function resolveDeliverablesWorkerUrl(): string | null {
  const explicit = process.env.DELIVERABLES_WORKER_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  const subdomain = process.env.CLOUDFLARE_ACCOUNT_SUBDOMAIN?.trim();
  if (subdomain) {
    return `https://${DELIVERABLES_WORKER_NAME}.${subdomain}.workers.dev`;
  }

  return null;
}

async function checkDatabase(): Promise<CheckStatus> {
  if (!envSet("DATABASE_URL")) {
    return "fail";
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return "ok";
  } catch {
    return "fail";
  }
}

function checkEmail(): CheckStatus {
  return envSet("RESEND_API_KEY") ? "ok" : "fail";
}

function checkStripe(): CheckStatus {
  return envSet("STRIPE_SECRET_KEY") && envSet("STRIPE_WEBHOOK_SECRET")
    ? "ok"
    : "fail";
}

async function checkDeliverables(): Promise<CheckStatus> {
  const workerUrl = resolveDeliverablesWorkerUrl();
  if (!workerUrl) {
    return "skip";
  }

  try {
    const response = await fetch(`${workerUrl}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(DELIVERABLES_PING_TIMEOUT_MS),
    });

    return response.ok ? "ok" : "fail";
  } catch {
    return "fail";
  }
}

function isCriticalFailure(checks: PortalHealthChecks): boolean {
  return checks.database === "fail" || checks.stripe === "fail";
}

function hasNonCriticalFailure(checks: PortalHealthChecks): boolean {
  return checks.email === "fail" || checks.deliverables === "fail";
}

export async function getPortalHealth(): Promise<{
  body: PortalHealthResponse;
  statusCode: number;
}> {
  const [database, deliverables] = await Promise.all([
    checkDatabase(),
    checkDeliverables(),
  ]);

  const checks: PortalHealthChecks = {
    database,
    email: checkEmail(),
    stripe: checkStripe(),
    deliverables,
  };

  const status: PortalHealthResponse["status"] =
    isCriticalFailure(checks) || hasNonCriticalFailure(checks) ? "degraded" : "ok";

  return {
    body: {
      status,
      app: "clinovyr-portal",
      checks,
    },
    statusCode: isCriticalFailure(checks) ? 503 : 200,
  };
}
