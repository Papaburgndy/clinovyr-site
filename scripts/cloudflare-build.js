#!/usr/bin/env node
/**
 * Wrangler [build].command for Cloudflare Workers Git Builds.
 *
 * Runs during `npx wrangler deploy` custom build phase (before main deploy):
 *   1. prisma generate
 *   2. opennextjs-cloudflare build
 *   3. deploy clinovyr-deliverables (CI only) so DELIVERABLES binding exists
 *
 * Keeps dashboard Deploy command as `npx wrangler deploy` with no changes.
 * See CLOUDFLARE-BUILD-SETTINGS.md Option D.
 */

const { spawnSync } = require("node:child_process");
const path = require("node:path");

const isCi =
  process.env.CI === "true" ||
  process.env.CI === "1" ||
  process.env.WORKERS_CI === "true" ||
  process.env.WORKERS_CI === "1" ||
  process.env.CF_PAGES === "1";

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

if (isCi) {
  const deliverablesConfig = path.join("workers", "deliverables", "wrangler.jsonc");
  run(
    "Deploy clinovyr-deliverables (DELIVERABLES binding target)",
    "npx",
    ["wrangler", "deploy", "-c", deliverablesConfig]
  );
} else {
  console.log(
    "[cloudflare-build] Skipping deliverables deploy outside CI (run deploy:deliverables manually)"
  );
}

console.log("[cloudflare-build] Done");
