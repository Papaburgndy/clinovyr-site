#!/usr/bin/env node
/**
 * Cloudflare Workers Git Builds deploy orchestrator (Option C).
 *
 * Deploys clinovyr-deliverables first (HTTP endpoint), then clinovyr-site.
 * Main site calls deliverables via DELIVERABLES_WORKER_URL — no service binding.
 *
 * Dashboard deploy command on clinovyr-site:
 *   node scripts/cloudflare-deploy.js
 *
 * Alternative to wrangler [build].command deliverables deploy (see cloudflare-build.js).
 * Any `npx wrangler deploy` from this OpenNext repo is redirected to
 * opennextjs-cloudflare deploy (clinovyr-site) unless OPEN_NEXT_DEPLOY=true.
 *
 * Pass --dry-run to verify bundle sizes locally.
 */

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const isCi =
  process.env.CI === "true" ||
  process.env.CI === "1" ||
  process.env.WORKERS_CI === "true" ||
  process.env.WORKERS_CI === "1" ||
  process.env.CF_PAGES === "1";

const dryRun = process.argv.includes("--dry-run");
const deliverablesConfig = path.join("workers", "deliverables", "wrangler.jsonc");
const DELIVERABLES_WORKER = "clinovyr-deliverables";

function run(label, command, args, extraEnv = {}) {
  console.log(`[cloudflare-deploy] ${label}`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ...extraEnv },
  });
  if (result.error) {
    console.error(`[cloudflare-deploy] Failed to start ${label}:`, result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (isCi) {
  console.log(
    `[cloudflare-deploy] CI detected (CI=${process.env.CI ?? ""}, WORKERS_CI=${process.env.WORKERS_CI ?? ""})`
  );
} else if (dryRun) {
  console.log("[cloudflare-deploy] Local dry-run (CI env not set)");
} else {
  console.log("[cloudflare-deploy] Running outside Workers CI — use for manual deploys");
}

process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://build:build@localhost:5432/build";

if (!fs.existsSync(".open-next/worker.js")) {
  console.log("[cloudflare-deploy] .open-next/ missing — running Prisma + OpenNext build");
  run("prisma generate", "npx", ["prisma", "generate"]);
  run("opennextjs-cloudflare build", "npx", ["opennextjs-cloudflare", "build"]);
}

const deliverablesArgs = ["wrangler", "deploy", "-c", deliverablesConfig];
if (dryRun) {
  deliverablesArgs.push("--dry-run");
}

console.log(
  `[cloudflare-deploy] Deploying ${DELIVERABLES_WORKER} (config: ${deliverablesConfig})`
);
run(
  dryRun
    ? `Dry-run ${DELIVERABLES_WORKER}`
    : `Deploying ${DELIVERABLES_WORKER} — expect *.workers.dev URL below`,
  "npx",
  deliverablesArgs,
  { OPEN_NEXT_DEPLOY: "true" }
);
console.log(
  `[cloudflare-deploy] ${DELIVERABLES_WORKER} ${dryRun ? "dry-run" : "deploy"} step finished OK`
);

if (dryRun) {
  run("Dry-run clinovyr-site (main)", "npx", ["wrangler", "deploy", "--dry-run"], {
    OPEN_NEXT_DEPLOY: "true",
  });
} else {
  console.log("[cloudflare-deploy] Deploying clinovyr-site (main) via opennextjs-cloudflare");
  run("Deploying clinovyr-site (main)", "npx", ["opennextjs-cloudflare", "deploy"]);
}

console.log("[cloudflare-deploy] Done");
