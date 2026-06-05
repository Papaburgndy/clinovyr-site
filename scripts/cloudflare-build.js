#!/usr/bin/env node
/**
 * Wrangler [build].command — compile OpenNext output before main deploy.
 *
 * Runs when deploy uses `npx wrangler deploy` (wrangler.jsonc [build].command).
 * Does NOT deploy clinovyr-deliverables here: nested `wrangler deploy` in an
 * OpenNext repo is hijacked by opennextjs-cloudflare and deploys clinovyr-site
 * instead. Use deploy command `node scripts/cloudflare-deploy.js` (Option C).
 *
 * Steps:
 *   1. prisma generate
 *   2. opennextjs-cloudflare build
 */

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");

function run(label, command, args) {
  console.log(`[cloudflare-build] ${label}`);
  const result = spawnSync(command, args, { stdio: "inherit", shell: true });
  if (result.error) {
    console.error(`[cloudflare-build] Failed to start ${label}:`, result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://build:build@localhost:5432/build";

run("prisma generate", "npx", ["prisma", "generate"]);
run("opennextjs-cloudflare build", "npx", ["opennextjs-cloudflare", "build"]);

if (fs.existsSync(".open-next/worker.js")) {
  console.log("[cloudflare-build] OpenNext output ready (.open-next/worker.js)");
} else {
  console.error("[cloudflare-build] Missing .open-next/worker.js after build");
  process.exit(1);
}

console.log(
  "[cloudflare-build] Done (deliverables deploy runs in deploy phase via scripts/cloudflare-deploy.js)"
);
