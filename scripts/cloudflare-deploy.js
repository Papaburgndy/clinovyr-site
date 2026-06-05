#!/usr/bin/env node
/**
 * Cloudflare Workers Git Builds deploy orchestrator.
 *
 * Deploys clinovyr-deliverables first so the DELIVERABLES service binding
 * exists, then deploys clinovyr-site (OpenNext main Worker).
 *
 * Set as dashboard Deploy command on clinovyr-site:
 *   node scripts/cloudflare-deploy.js
 *
 * Pair with postinstall CI build (scripts/ci-opennext-build.js) when
 * Build command is empty. Pass --dry-run to verify bundle sizes locally.
 */

const { spawnSync } = require("node:child_process");
const path = require("node:path");

const isCi =
  process.env.CI === "true" ||
  process.env.CI === "1" ||
  process.env.WORKERS_CI === "true" ||
  process.env.WORKERS_CI === "1" ||
  process.env.CF_PAGES === "1";

const dryRun = process.argv.includes("--dry-run");
const deliverablesConfig = path.join("workers", "deliverables", "wrangler.jsonc");

function run(label, command, args) {
  console.log(`[cloudflare-deploy] ${label}`);
  const result = spawnSync(command, args, { stdio: "inherit", shell: true });
  if (result.error) {
    console.error(`[cloudflare-deploy] Failed to start ${label}:`, result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (isCi) {
  console.log("[cloudflare-deploy] CI / WORKERS_CI detected");
} else if (dryRun) {
  console.log("[cloudflare-deploy] Local dry-run (CI env not set)");
} else {
  console.log("[cloudflare-deploy] Running outside Workers CI — use for manual deploys");
}

process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://build:build@localhost:5432/build";

const deliverablesArgs = ["wrangler", "deploy", "-c", deliverablesConfig];
if (dryRun) {
  deliverablesArgs.push("--dry-run");
}

run(
  dryRun ? "Dry-run clinovyr-deliverables" : "Deploying clinovyr-deliverables first",
  "npx",
  deliverablesArgs
);

if (dryRun) {
  const mainArgs = ["wrangler", "deploy", "--dry-run"];
  run("Dry-run clinovyr-site (main)", "npx", mainArgs);
} else {
  run("Deploying clinovyr-site (main)", "npx", ["opennextjs-cloudflare", "deploy"]);
}

console.log("[cloudflare-deploy] Done");
