/**
 * Six-industry deliverable E2E test.
 * Usage: node scripts/e2e-six-industries.mjs
 *
 * Tries PostgreSQL + full runDeliverableGeneration; falls back to
 * isolated generator tests with mock company/survey fixtures.
 */
import { spawnSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function tryStartPostgres() {
  const brew = spawnSync("brew", ["services", "list"], { encoding: "utf8" });
  if (brew.status === 0 && /postgresql.*started/i.test(brew.stdout ?? "")) {
    console.log("PostgreSQL brew service appears running");
    return;
  }

  const start = spawnSync("brew", ["services", "start", "postgresql@16"], {
    encoding: "utf8",
  });
  if (start.status === 0) {
    console.log("Started postgresql@16 via brew");
    return;
  }

  const docker = spawnSync(
    "docker",
    ["start", "clinovyr-postgres"],
    { encoding: "utf8" },
  );
  if (docker.status === 0) {
    console.log("Started clinovyr-postgres docker container");
  }
}

function runMigrations() {
  const migrate = spawnSync("npm", ["run", "db:push"], {
    cwd: root,
    encoding: "utf8",
    stdio: "inherit",
  });
  if (migrate.status !== 0) {
    console.warn("db:push failed or skipped — core test will fall back if DB unreachable");
  }
}

console.log("\nClinovyr six-industry E2E — preparing environment\n");
tryStartPostgres();
runMigrations();

const result = spawnSync(
  "npx",
  ["--yes", "tsx", "scripts/e2e-six-industries-core.ts"],
  {
    cwd: root,
    encoding: "utf8",
    stdio: "inherit",
    env: process.env,
  },
);

process.exit(result.status ?? 1);
