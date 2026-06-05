#!/usr/bin/env node
/**
 * Local / GitHub Actions deploy orchestrator.
 *
 * Deploys clinovyr-deliverables first (HTTP endpoint), then clinovyr-site.
 * Main site calls deliverables via DELIVERABLES_WORKER_URL — no service binding.
 *
 * NOT for clinovyr-site Workers Builds: Cloudflare sets WRANGLER_CI_OVERRIDE_NAME
 * to clinovyr-site and overrides any wrangler deploy to that Worker. Use separate
 * Workers Builds on clinovyr-deliverables instead (see DEPLOY.md).
 *
 * Local dry-run (after `npm run build:cloudflare`):
 *   node scripts/cloudflare-deploy.js --dry-run
 */

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const dryRun = process.argv.includes("--dry-run");
const deliverablesConfig = path.join("workers", "deliverables", "wrangler.jsonc");
const DELIVERABLES_WORKER = "clinovyr-deliverables";
const MAIN_WORKER = "clinovyr-site";

const ciOverrideName = process.env.WRANGLER_CI_OVERRIDE_NAME?.trim();

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

function shouldSkipDeliverablesDeploy() {
  if (!ciOverrideName) {
    return false;
  }
  return ciOverrideName !== DELIVERABLES_WORKER;
}

process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://build:build@localhost:5432/build";

if (!fs.existsSync(".open-next/worker.js")) {
  console.log("[cloudflare-deploy] .open-next/ missing — running Prisma + OpenNext build");
  run("prisma generate", "npx", ["prisma", "generate"]);
  run("opennextjs-cloudflare build", "npx", ["opennextjs-cloudflare", "build"]);
}

const skipDeliverables = shouldSkipDeliverablesDeploy();

if (skipDeliverables) {
  console.warn(
    `[cloudflare-deploy] Skipping ${DELIVERABLES_WORKER} deploy — Workers Builds is connected to "${ciOverrideName}" (WRANGLER_CI_OVERRIDE_NAME). Any wrangler deploy from this pipeline targets ${ciOverrideName}, not ${DELIVERABLES_WORKER}. Deploy deliverables from a separate Workers Builds on ${DELIVERABLES_WORKER}. See DEPLOY.md and CLOUDFLARE-BUILD-SETTINGS.md.`
  );
} else {
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
}

if (ciOverrideName === DELIVERABLES_WORKER) {
  console.log(
    `[cloudflare-deploy] Done (${DELIVERABLES_WORKER} only — Workers Builds connected to deliverables worker)`
  );
  process.exit(0);
}

if (dryRun) {
  run("Dry-run clinovyr-site (main)", "npx", ["wrangler", "deploy", "--dry-run"], {
    OPEN_NEXT_DEPLOY: "true",
  });
} else {
  console.log(`[cloudflare-deploy] Deploying ${MAIN_WORKER} (main) via opennextjs-cloudflare`);
  run(`Deploying ${MAIN_WORKER} (main)`, "npx", ["opennextjs-cloudflare", "deploy"]);
}

console.log("[cloudflare-deploy] Done");
