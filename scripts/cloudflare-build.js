#!/usr/bin/env node
/**
 * Wrangler [build].command — compile OpenNext output only.
 *
 * Runs when deploy uses `npx wrangler deploy` (wrangler.jsonc [build].command).
 * Does NOT deploy clinovyr-deliverables — Workers Builds connected to
 * clinovyr-site sets WRANGLER_CI_OVERRIDE_NAME and forces all wrangler deploy
 * calls to clinovyr-site. Deploy deliverables from a separate Workers Builds
 * on clinovyr-deliverables (see DEPLOY.md).
 *
 * Steps:
 *   1. prisma generate
 *   2. opennextjs-cloudflare build
 */

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");

function run(label, command, args) {
  console.log(`[cloudflare-build] ${label}`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
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
  "[cloudflare-build] Done (deliverables worker must be deployed separately — see DEPLOY.md)"
);
