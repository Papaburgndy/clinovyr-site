#!/usr/bin/env npx tsx
/**
 * Ping health endpoints for all Clinovyr product apps.
 *
 *   npx tsx health-check.ts           # production subdomains
 *   npx tsx health-check.ts --local   # localhost dev ports
 */

type Target = {
  name: string;
  productionUrl: string;
  localPort: number;
};

const TARGETS: Target[] = [
  {
    name: "assessment",
    productionUrl: "https://assessment.clinovyr.com/api/health",
    localPort: 3001,
  },
  {
    name: "ai-agent",
    productionUrl: "https://agent.clinovyr.com/api/health",
    localPort: 3100,
  },
  {
    name: "dashboard",
    productionUrl: "https://app.clinovyr.com/api/health",
    localPort: 3002,
  },
  {
    name: "playbooks",
    productionUrl: "https://buy.clinovyr.com/api/health",
    localPort: 3003,
  },
];

type HealthBody = {
  status: string;
  checks?: {
    filesystem?: boolean;
    anthropicKeyFormat?: boolean;
    env?: Record<string, boolean>;
  };
};

function resolveUrl(target: Target, local: boolean): string {
  if (local) {
    return `http://localhost:${target.localPort}/api/health`;
  }
  return target.productionUrl;
}

async function ping(name: string, url: string) {
  const started = Date.now();
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
    const elapsed = Date.now() - started;
    let body: HealthBody | null = null;
    try {
      body = (await response.json()) as HealthBody;
    } catch {
      body = null;
    }
    return {
      name,
      url,
      http: response.status,
      status: body?.status ?? "unknown",
      filesystem: body?.checks?.filesystem,
      anthropicKeyFormat: body?.checks?.anthropicKeyFormat,
      ms: elapsed,
      ok: response.ok,
      error: null as string | null,
    };
  } catch (error) {
    return {
      name,
      url,
      http: 0,
      status: "unreachable",
      filesystem: undefined,
      anthropicKeyFormat: undefined,
      ms: Date.now() - started,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function pad(value: string, width: number): string {
  return value.length >= width ? value : value + " ".repeat(width - value.length);
}

async function main() {
  const local = process.argv.includes("--local");
  const mode = local ? "local" : "production";

  console.log(`Clinovyr products health check (${mode})\n`);

  const results = await Promise.all(
    TARGETS.map((target) => ping(target.name, resolveUrl(target, local))),
  );

  const col = {
    name: 12,
    http: 5,
    status: 10,
    fs: 5,
    anthropic: 10,
    ms: 6,
  };

  console.log(
    `${pad("Service", col.name)}  ${pad("HTTP", col.http)}  ${pad("Status", col.status)}  ${pad("FS", col.fs)}  ${pad("Anthropic", col.anthropic)}  ${pad("ms", col.ms)}  URL`,
  );
  console.log("-".repeat(90));

  let failures = 0;
  for (const row of results) {
    if (!row.ok) failures += 1;
    const fs = row.filesystem === undefined ? "—" : row.filesystem ? "yes" : "no";
    const anthropic =
      row.anthropicKeyFormat === undefined
        ? "—"
        : row.anthropicKeyFormat
          ? "yes"
          : "no";
    console.log(
      `${pad(row.name, col.name)}  ${pad(String(row.http || "—"), col.http)}  ${pad(row.status, col.status)}  ${pad(fs, col.fs)}  ${pad(anthropic, col.anthropic)}  ${pad(String(row.ms), col.ms)}  ${row.url}${row.error ? ` (${row.error})` : ""}`,
    );
  }

  console.log("");
  if (failures === 0) {
    console.log("All endpoints responded successfully.");
  } else {
    console.log(`${failures} endpoint(s) failed or returned non-2xx.`);
    process.exitCode = 1;
  }
}

main();
