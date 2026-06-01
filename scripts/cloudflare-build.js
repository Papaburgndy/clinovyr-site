#!/usr/bin/env node
/**
 * Runs OpenNext build during Cloudflare Workers Builds (and other CI) so
 * `npx wrangler deploy` succeeds even when the dashboard deploy command
 * skips an explicit build step.
 *
 * Cloudflare injects CI=true and WORKERS_CI=1 during Workers Builds.
 * See: https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
 */

const { spawnSync } = require("node:child_process");

const isCi =
  process.env.CI === "true" ||
  process.env.CI === "1" ||
  process.env.WORKERS_CI === "1" ||
  process.env.CF_PAGES === "1";

if (!isCi) {
  process.exit(0);
}

console.log("[cloudflare-build] CI detected — running opennextjs-cloudflare build");

const result = spawnSync("npx", ["opennextjs-cloudflare", "build"], {
  stdio: "inherit",
  shell: true,
});

if (result.error) {
  console.error("[cloudflare-build] Failed to start build:", result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
