#!/usr/bin/env node
/**
 * Wrangler [build].command — compile OpenNext output, deploy deliverables, then main deploy.
 *
 * Runs when deploy uses `npx wrangler deploy` (wrangler.jsonc [build].command).
 * Deploys clinovyr-deliverables here so the DELIVERABLES service binding exists
 * before the hijacked OpenNext deploy publishes clinovyr-site.
 *
 * Nested `npx wrangler deploy` in an OpenNext repo is hijacked to clinovyr-site
 * unless OPEN_NEXT_DEPLOY=true — set that env when deploying deliverables.
 *
 * Steps:
 *   1. prisma generate
 *   2. opennextjs-cloudflare build
 *   3. wrangler deploy -c workers/deliverables/wrangler.jsonc (OPEN_NEXT_DEPLOY=true)
 */

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const deliverablesConfig = path.join("workers", "deliverables", "wrangler.jsonc");
const DELIVERABLES_WORKER = "clinovyr-deliverables";

function run(label, command, args, extraEnv = {}) {
  console.log(`[cloudflare-build] ${label}`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ...extraEnv },
  });
  if (result.error) {
    console.error(`[cloudflare-build] Failed to start ${label}:`, result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runDeliverablesDeploy() {
  console.log(
    `[cloudflare-build] Deploying ${DELIVERABLES_WORKER} with OPEN_NEXT_DEPLOY=true`
  );
  console.log(`[cloudflare-build] Config: ${deliverablesConfig}`);

  const result = spawnSync(
    "npx",
    ["wrangler", "deploy", "-c", deliverablesConfig],
    {
      stdio: "pipe",
      shell: true,
      encoding: "utf-8",
      env: { ...process.env, OPEN_NEXT_DEPLOY: "true" },
    }
  );

  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  if (output) {
    process.stdout.write(output);
  }

  if (result.error) {
    console.error(
      `[cloudflare-build] Failed to start ${DELIVERABLES_WORKER} deploy:`,
      result.error.message
    );
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  if (output.includes(DELIVERABLES_WORKER)) {
    console.log(
      `[cloudflare-build] Verified deploy output references ${DELIVERABLES_WORKER}`
    );
  } else if (output.includes("clinovyr-site")) {
    console.error(
      `[cloudflare-build] ERROR: deploy targeted clinovyr-site instead of ${DELIVERABLES_WORKER} — OpenNext hijack not bypassed`
    );
    process.exit(1);
  } else {
    console.warn(
      `[cloudflare-build] WARNING: deploy output did not mention ${DELIVERABLES_WORKER} — check logs for *.workers.dev URL`
    );
  }

  console.log(`[cloudflare-build] ${DELIVERABLES_WORKER} deploy finished OK`);
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

runDeliverablesDeploy();

console.log(
  "[cloudflare-build] Done (clinovyr-site deploy continues in wrangler deploy phase)"
);
