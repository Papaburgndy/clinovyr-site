#!/usr/bin/env node
/**
 * CI-only OpenNext build hook for Cloudflare Workers Git Builds.
 * Runs after `npm ci` via package.json postinstall when CI or WORKERS_CI is set.
 *
 * Skips locally unless CI=true or WORKERS_CI=1 (or CF_PAGES=1).
 * See: https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
 */

const { spawnSync } = require("node:child_process");

const isCi =
  process.env.CI === "true" ||
  process.env.CI === "1" ||
  process.env.WORKERS_CI === "true" ||
  process.env.WORKERS_CI === "1" ||
  process.env.CF_PAGES === "1";

if (!isCi) {
  process.exit(0);
}

console.log("[ci-opennext-build] CI detected — prisma generate + opennextjs-cloudflare build");

// Next/OpenNext page & route collection imports Prisma; ensure build never fails on missing secret.
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://build:build@localhost:5432/build";

const gen = spawnSync("npx", ["prisma", "generate"], { stdio: "inherit", shell: true });
if (gen.status !== 0) {
  process.exit(gen.status ?? 1);
}

const result = spawnSync("npx", ["opennextjs-cloudflare", "build"], {
  stdio: "inherit",
  shell: true,
});

if (result.error) {
  console.error("[ci-opennext-build] Failed to start build:", result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
